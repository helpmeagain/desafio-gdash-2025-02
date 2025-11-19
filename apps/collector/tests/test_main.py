import pytest
from main import main

def test_main(capsys: pytest.CaptureFixture[str]) -> None:
    main()
    captured = capsys.readouterr()
    assert "Collector rodando!" in captured.out