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

function fetchNearbyStations(lat, lon, callback, errorCallback) {
    const url = `https://api.waqi.info/map/bounds/?latlng=${lat - 0.01},${lon - 0.01},${lat + 0.01},${lon + 0.01}&token=${TOKEN}`;
    const req = new Request(url);
    req.loadJSON().then(function (response) {
        if (response.status !== "ok") {
            errorCallback("Failed to fetch nearby stations.");
        } else {
            callback(response.data);
        }
    }).catch(function (error) {
        errorCallback(error.message);
    });
}

function calculateAveragePM(stations) {
    let pm25Sum = 0, pm10Sum = 0, pm25Count = 0, pm10Count = 0;
    stations.forEach(station => {
        if (station.iaqi?.pm25?.v) {
            pm25Sum += station.iaqi.pm25.v;
            pm25Count++;
        }
        if (station.iaqi?.pm10?.v) {
            pm10Sum += station.iaqi.pm10.v;
            pm10Count++;
        }
    });
    return {
        avgPM25: pm25Count > 0 ? (pm25Sum / pm25Count).toFixed(1) : "N/A",
        avgPM10: pm10Count > 0 ? (pm10Sum / pm10Count).toFixed(1) : "N/A"
    };
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

function addAverageAirQualitySection(widget, avgData) {
    const avgTitle = widget.addText("Zone Average:");
    avgTitle.font = Font.boldSystemFont(14);
    avgTitle.textColor = Color.white();

    widget.addSpacer(4);

    const avgPM25Text = widget.addText("PM2.5: " + avgData.avgPM25);
    avgPM25Text.font = Font.mediumSystemFont(14);
    avgPM25Text.textColor = typeof avgData.avgPM25 === "number" ? getAQIColor(avgData.avgPM25) : Color.gray();

    const avgPM10Text = widget.addText("PM10: " + avgData.avgPM10);
    avgPM10Text.font = Font.mediumSystemFont(14);
    avgPM10Text.textColor = typeof avgData.avgPM10 === "number" ? getAQIColor(avgData.avgPM10) : Color.gray();

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
        const leftStack = widget.addStack();
        const rightStack = widget.addStack();

        leftStack.layoutVertically();
        rightStack.layoutVertically();

        addAirQualitySection(leftStack, stationData, "Station: " + stationData.city.name);

        const lat = stationData.city.geo[0];
        const lon = stationData.city.geo[1];

        fetchNearbyStations(lat, lon, function (stations) {
            const avgData = calculateAveragePM(stations);
            addAverageAirQualitySection(rightStack, avgData);

            if (config.runsInWidget) {
                Script.setWidget(widget);
                Script.complete();
            } else {
                widget.presentMedium();
            }
        }, function (error) {
            const errorText = widget.addText("Failed to fetch nearby stations");
            errorText.font = Font.mediumSystemFont(12);
            errorText.textColor = Color.red();
        });

    }, function (error) {
        const errorText = widget.addText("Failed to fetch station data");
        errorText.font = Font.mediumSystemFont(12);
        errorText.textColor = Color.red();
    });

    return widget;
}

createWidget();
