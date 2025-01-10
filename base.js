const GITHUB_URL = "https://raw.githubusercontent.com/username/repo/main/script.js";

async function fetchAndRunScript() {
    try {
        const request = new Request(GITHUB_URL);
        const script = await request.loadString();

        // Выполняем загруженный код
        eval(script);
    } catch (error) {
        // Создаем виджет для отображения ошибок
        const widget = new ListWidget();
        widget.backgroundColor = new Color("#1c1c1e");

        const title = widget.addText("Error loading script");
        title.font = Font.boldSystemFont(16);
        title.textColor = Color.red();

        const errorText = widget.addText(error.message);
        errorText.font = Font.mediumSystemFont(12);
        errorText.textColor = Color.white();

        if (config.runsInWidget) {
            Script.setWidget(widget);
            Script.complete();
        } else {
            widget.presentMedium();
        }
    }
}

await fetchAndRunScript();
