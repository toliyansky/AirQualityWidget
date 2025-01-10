const TOKEN = "bf708a60d30c613b2bcef984dac36f0067222c0a";

function fetchAirQuality(stationId, callback, errorCallback) {
    const url = "https://api.waqi.info/feed/" + stationId + "/?token=" + TOKEN;
    const req = new Request(url);
    req.loadJSON().then(function (response) {
        if (response.status !== "ok") {
            errorCallback(`Failed to fetch air quality data for ${stationId}`);
        } else {
            callback(response.data);
        }
    }).catch(function (error) {
        errorCallback(error.message);
    });
}

function getAQIColor(value) {
    if (value <= 50) return new Color("#00e400"); // Good
    if (value <= 100) return new Color("#ffff00"); // Moderate
    if (value <= 150) return new Color("#ff7e00"); // Unhealthy for Sensitive Groups
    if (value <= 200) return new Color("#ff0000"); // Unhealthy
    if (value <= 300) return new Color("#99004c"); // Very Unhealthy
    return new Color("#7e0023"); // Hazardous
}

function formatUpdateTime(time) {
    const date = new Date(time);
    const options = {
        timeZone: "Europe/Sofia",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
}

function addAirQualitySection(widget, data, locationName) {
    const pm25 = data.iaqi && data.iaqi.pm25 ? data.iaqi.pm25.v : "N/A";
    const pm10 = data.iaqi && data.iaqi.pm10 ? data.iaqi.pm10.v : "N/A";
    const lastUpdate = data.time && data.time.iso ? data.time.iso : null;

    const locationTitle = widget.addText(locationName);
    locationTitle.font = Font.boldSystemFont(14);
    locationTitle.textColor = Color.white();

    widget.addSpacer(4);

    const pm25Text = widget.addText("PM2.5: " + pm25);
    pm25Text.font = Font.mediumSystemFont(14);
    pm25Text.textColor = typeof pm25 === "number" ? getAQIColor(pm25) : Color.gray();

    const pm10Text = widget.addText("PM10: " + pm10);
    pm10Text.font = Font.mediumSystemFont(14);
    pm10Text.textColor = typeof pm10 === "number" ? getAQIColor(pm10) : Color.gray();

    widget.addSpacer(4);

    if (lastUpdate) {
        const updateTime = formatUpdateTime(lastUpdate);
        const updateText = widget.addText("Updated: " + updateTime);
        updateText.font = Font.mediumSystemFont(12);
        updateText.textColor = Color.gray();
    }

    widget.addSpacer(8);
}

function createWidget() {
    const homeStationId = "A232735"; // Example station ID
    const widget = new ListWidget();
    widget.backgroundColor = new Color("#1c1c1e");

    const title = widget.addText("Air Quality");
    title.font = Font.boldSystemFont(16);
    title.textColor = Color.white();

    widget.addSpacer(8);

    fetchAirQuality(homeStationId, function (stationData) {
        addAirQualitySection(widget, stationData, "Station: " + stationData.city.name);
        if (config.runsInWidget) {
            Script.setWidget(widget);
            Script.complete();
        } else {
            widget.presentMedium();
        }
    }, function (error) {
        const errorText = widget.addText("Failed to fetch station data");
        errorText.font = Font.mediumSystemFont(12);
        errorText.textColor = Color.red();
        widget.addSpacer(8);

        if (config.runsInWidget) {
            Script.setWidget(widget);
            Script.complete();
        } else {
            widget.presentMedium();
        }
    });

    return widget;
}

// Main execution
if (!config.runsInWidget) {
    createWidget();
}
