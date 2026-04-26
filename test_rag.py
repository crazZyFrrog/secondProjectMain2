"""
Tests for RAG implementation in bot.py.

Categories:
  A. Unit tests for _load_knowledge_base()
  B. Knowledge file content validation
  C. SYSTEM_PROMPT injection (KB appears in prompt)
  D. get_messages_for_api() structure
  E. trim_history() logic
"""

import pathlib
import sys
from types import ModuleType
from unittest.mock import MagicMock, patch

import pytest


# ── helpers: stub heavy external deps so bot.py can be imported without infra ──

def _make_stubs() -> dict:
    tg = ModuleType("telegram")
    tg.Update = MagicMock()

    tg_const = ModuleType("telegram.constants")
    tg_const.ChatAction = MagicMock()

    tg_ext = ModuleType("telegram.ext")
    for attr in ("Application", "CommandHandler", "MessageHandler",
                 "ContextTypes", "filters"):
        setattr(tg_ext, attr, MagicMock())

    gigachat_m = ModuleType("gigachat")
    gigachat_m.GigaChat = MagicMock()

    gigachat_models_m = ModuleType("gigachat.models")
    gigachat_models_m.Chat = MagicMock()
    gigachat_models_m.Messages = MagicMock()
    gigachat_models_m.MessagesRole = MagicMock()

    dotenv_m = ModuleType("dotenv")
    dotenv_m.load_dotenv = MagicMock()

    return {
        "telegram": tg,
        "telegram.constants": tg_const,
        "telegram.ext": tg_ext,
        "gigachat": gigachat_m,
        "gigachat.models": gigachat_models_m,
        "dotenv": dotenv_m,
    }


@pytest.fixture(scope="module")
def bot():
    """Import bot.py once per test module with all external deps stubbed."""
    sys.modules.pop("bot", None)
    stubs = _make_stubs()
    with patch.dict(sys.modules, stubs):
        with patch.dict("os.environ", {
            "TELEGRAM_BOT_TOKEN": "fake-token",
            "GIGACHAT_API_KEY": "fake-credentials",
        }):
            import bot as _bot
            yield _bot
    sys.modules.pop("bot", None)


# ── A. Unit tests for _load_knowledge_base() ──────────────────────────────────

class TestLoadKnowledgeBase:

    def test_returns_content_when_file_exists(self, tmp_path, bot):
        kb_content = "## FAQ\nQ: Цена?\nA: 30 000 ₽"
        kb_file = tmp_path / "knowledge.md"
        kb_file.write_text(kb_content, encoding="utf-8")

        with patch("pathlib.Path.read_text", return_value=kb_content):
            result = bot._load_knowledge_base()

        assert result == kb_content

    def test_returns_empty_string_when_file_not_found(self, bot):
        with patch("pathlib.Path.read_text", side_effect=FileNotFoundError):
            result = bot._load_knowledge_base()

        assert result == ""

    def test_logs_warning_on_missing_file(self, bot, caplog):
        import logging
        with patch("pathlib.Path.read_text", side_effect=FileNotFoundError):
            with caplog.at_level(logging.WARNING, logger="bot"):
                bot._load_knowledge_base()

        assert any("knowledge.md" in msg for msg in caplog.messages)

    def test_logs_info_with_char_count_on_success(self, bot, caplog):
        import logging
        sample = "Тестовый контент базы знаний"
        with patch("pathlib.Path.read_text", return_value=sample):
            with caplog.at_level(logging.INFO, logger="bot"):
                bot._load_knowledge_base()

        assert any(str(len(sample)) in msg for msg in caplog.messages)


# ── B. Knowledge file content validation ──────────────────────────────────────

KB_PATH = pathlib.Path(__file__).parent / "knowledge.md"


@pytest.mark.skipif(not KB_PATH.exists(), reason="knowledge.md не найден")
class TestKnowledgeFileContent:

    @pytest.fixture(scope="class")
    def kb_text(self):
        return KB_PATH.read_text(encoding="utf-8")

    def test_file_is_not_empty(self, kb_text):
        assert len(kb_text.strip()) > 0

    def test_file_has_minimum_length(self, kb_text):
        # минимум 2 страницы = ~2000 символов
        assert len(kb_text) >= 2000, (
            f"База знаний слишком короткая: {len(kb_text)} символов"
        )

    def test_contains_price_landing(self, kb_text):
        assert "30 000" in kb_text, "Нет цены на лендинг (30 000 ₽)"

    def test_contains_price_shop(self, kb_text):
        assert "70 000" in kb_text, "Нет цены на интернет-магазин (70 000 ₽)"

    def test_contains_price_subscription(self, kb_text):
        assert "1 990" in kb_text, "Нет цены подписки Pro (1 990 ₽/мес.)"

    def test_contains_price_support(self, kb_text):
        assert "5 000" in kb_text, "Нет цены поддержки (5 000 ₽/мес.)"

    def test_contains_services_section(self, kb_text):
        assert "Услуги" in kb_text or "услуг" in kb_text

    def test_contains_process_section(self, kb_text):
        assert "Процесс" in kb_text or "процесс" in kb_text or "этап" in kb_text

    def test_contains_guarantee_section(self, kb_text):
        assert "гарант" in kb_text.lower()

    def test_contains_payment_section(self, kb_text):
        assert "оплат" in kb_text.lower()

    def test_has_at_least_15_qa_pairs(self, kb_text):
        # Считаем вопросы по маркерам Q1..Q20 или "**Q"
        import re
        questions = re.findall(r"\*\*Q\d+", kb_text)
        assert len(questions) >= 15, (
            f"Найдено только {len(questions)} вопросов, нужно минимум 15"
        )

    def test_company_name_present(self, kb_text):
        assert "LandingBuilder" in kb_text


# ── C. SYSTEM_PROMPT injection ────────────────────────────────────────────────

class TestSystemPromptInjection:

    def test_knowledge_base_is_loaded(self, bot):
        assert isinstance(bot.KNOWLEDGE_BASE, str)
        assert len(bot.KNOWLEDGE_BASE) > 0, "KNOWLEDGE_BASE пустой — файл не загрузился"

    def test_knowledge_section_not_empty(self, bot):
        assert bot._KNOWLEDGE_SECTION != "", "_KNOWLEDGE_SECTION пустой"

    def test_knowledge_section_contains_marker(self, bot):
        assert "БАЗА ЗНАНИЙ" in bot._KNOWLEDGE_SECTION

    def test_knowledge_section_wrapped_in_delimiters(self, bot):
        assert "---" in bot._KNOWLEDGE_SECTION

    def test_system_prompt_contains_knowledge_base(self, bot):
        assert bot.KNOWLEDGE_BASE in bot.SYSTEM_PROMPT, (
            "KNOWLEDGE_BASE не попал в SYSTEM_PROMPT"
        )

    def test_system_prompt_contains_kb_rule(self, bot):
        assert "БАЗА ЗНАНИЙ" in bot.SYSTEM_PROMPT

    def test_system_prompt_contains_context_only_instruction(self, bot):
        prompt = bot.SYSTEM_PROMPT
        assert "ТОЛЬКО" in prompt and ("БАЗА ЗНАНИЙ" in prompt or "базе знаний" in prompt)

    def test_system_prompt_contains_price_30000(self, bot):
        assert "30 000" in bot.SYSTEM_PROMPT

    def test_system_prompt_contains_price_70000(self, bot):
        assert "70 000" in bot.SYSTEM_PROMPT

    def test_system_prompt_contains_nadejda_role(self, bot):
        assert "Надежда" in bot.SYSTEM_PROMPT

    def test_knowledge_base_appended_after_rules(self, bot):
        # KB-блок должен идти ПОСЛЕ основных инструкций
        rule_pos = bot.SYSTEM_PROMPT.find("ПРАВИЛО РАБОТЫ С БАЗОЙ ЗНАНИЙ")
        kb_pos = bot.SYSTEM_PROMPT.find("БАЗА ЗНАНИЙ")
        assert rule_pos != -1, "Правило работы с KB не найдено"
        assert kb_pos > rule_pos, "БАЗА ЗНАНИЙ идёт раньше правила"


# ── D. get_messages_for_api() structure ──────────────────────────────────────

class TestGetMessagesForApi:

    def test_returns_list(self, bot):
        result = bot.get_messages_for_api(chat_id=999)
        assert isinstance(result, list)

    def test_first_message_is_system(self, bot):
        result = bot.get_messages_for_api(chat_id=999)
        assert result[0]["role"] == "system"

    def test_system_message_contains_full_prompt(self, bot):
        result = bot.get_messages_for_api(chat_id=999)
        assert result[0]["content"] == bot.SYSTEM_PROMPT

    def test_system_message_content_has_knowledge_base(self, bot):
        result = bot.get_messages_for_api(chat_id=999)
        assert "БАЗА ЗНАНИЙ" in result[0]["content"]

    def test_empty_history_gives_one_message(self, bot):
        bot.chat_histories[1001] = []
        result = bot.get_messages_for_api(chat_id=1001)
        assert len(result) == 1

    def test_history_appended_after_system(self, bot):
        bot.chat_histories[1002] = [
            {"role": "user", "content": "Сколько стоит лендинг?"},
            {"role": "assistant", "content": "30 000 ₽"},
        ]
        result = bot.get_messages_for_api(chat_id=1002)
        assert len(result) == 3
        assert result[1]["role"] == "user"
        assert result[2]["role"] == "assistant"

    def test_system_message_always_first_with_history(self, bot):
        bot.chat_histories[1003] = [
            {"role": "user", "content": "Привет"},
        ]
        result = bot.get_messages_for_api(chat_id=1003)
        assert result[0]["role"] == "system"


# ── E. trim_history() logic ───────────────────────────────────────────────────

class TestTrimHistory:

    def test_does_not_trim_short_history(self, bot):
        bot.chat_histories[2001] = [{"role": "user", "content": str(i)}
                                     for i in range(5)]
        bot.trim_history(2001)
        assert len(bot.chat_histories[2001]) == 5

    def test_trims_to_max_history(self, bot):
        max_h = bot.MAX_HISTORY
        bot.chat_histories[2002] = [{"role": "user", "content": str(i)}
                                     for i in range(max_h + 5)]
        bot.trim_history(2002)
        assert len(bot.chat_histories[2002]) == max_h

    def test_keeps_most_recent_messages(self, bot):
        max_h = bot.MAX_HISTORY
        messages = [{"role": "user", "content": str(i)}
                    for i in range(max_h + 3)]
        bot.chat_histories[2003] = messages.copy()
        bot.trim_history(2003)
        kept = bot.chat_histories[2003]
        # Должны остаться последние MAX_HISTORY сообщений
        assert kept == messages[-max_h:]

    def test_trim_on_exact_max_history_does_nothing(self, bot):
        max_h = bot.MAX_HISTORY
        messages = [{"role": "user", "content": str(i)} for i in range(max_h)]
        bot.chat_histories[2004] = messages.copy()
        bot.trim_history(2004)
        assert len(bot.chat_histories[2004]) == max_h

    def test_trim_empty_history_is_safe(self, bot):
        bot.chat_histories[2005] = []
        bot.trim_history(2005)
        assert bot.chat_histories[2005] == []
