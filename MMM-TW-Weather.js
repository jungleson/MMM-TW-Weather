/* Magic Mirror
 * Module: MMM-TW-Weather
 *
 * By Ted Chou
 * MIT Licensed.
 * Some code is borrowed from
 * https://github.com/roramirez/MagicMirror-Module-Template
 * https://github.com/sathyarajv/MMM-OpenmapWeather
 * https://github.com/sathyarajv/MMM-WeatherChart
 */

Module.register("MMM-WeatherChart", {
    defaults: {
        updateInterval: 10 * 60 * 1000,
        retryDelay: 5000,
		apiBase: "https://opendata.cwb.gov.tw/api/v1/rest/datastore/",
        apiKey: "",

		dataid: "",
		locationName: "",
		elementName: "",
		format: "JSON",

        units: "standard",
        lang: "en",
        chartjsVersion: "3.4.0",
        chartjsDatalabelsVersion: "2.0.0",
        height: "300px",
        width: "500px",
        fontSize: 16,
        fontWeight: "normal",
        dataNum: 24,
        title: "Taiwan Weather Forecast",
        // https://www.cwb.gov.tw/V8/assets/img/weather_icons/weathers/svg_icon/night/01.svg
        iconURLBase: "https://www.cwb.gov.tw/V8/assets/img/weather_icons/weathers/svg_icon/",
        dataType: "hourly",
        showIcon: true,
        color: "rgba(255, 255, 255, 1)",
        colorRed: "rgba(255, 90, 90, 1)",
        colorBlue: "rgba(90, 90, 255, 1)",
        backgroundColor: "rgba(0, 0, 0, 0)",
        fillColor: "rgba(255, 255, 255, 0.1)",
        dailyLabel: "date",
        curveTension: 0.4,
        datalabelsDisplay: "auto",
        datalabelsOffset: 4,
        datalabelsRoundDecimalPlace: 1,
    },

    requiresVersion: "2.15.0",

    start: function () {
        var self = this;
        var dataRequest = null;
        var dataNotification = null;

        //Flag for check if module is loaded
        this.loaded = false;

        // Schedule update timer.
        this.getData();
        setInterval(function () {
            self.updateDom();
        }, this.config.updateInterval);
    },

    /*
     * getData
     * function example return data and show it in the module wrapper
     * get a URL request
     *
     */
    getData: function () {
        var self = this;

        if (this.config.apiKey === "") {
            Log.error(self.name + ": apiKey must be specified");
            return;
        }
        if (this.config.lat === "" && this.config.lon === "") {
            Log.error(self.name + ": location (lat and lon) must be specified");
            return;
        }


        var url =
            this.config.apiBase + this.config.dataid + this.getParams();

        var retry = true;

		console.log(url);

        fetch(url)
            .then((res) => {
                if (res.status == 401) {
                    retry = false;
                    throw new Error(self.name + ": apiKey is invalid");
                } else if (!res.ok) {
                    throw new Error(self.name + ": failed to get api response");
                }
                return res.json();
            })
            .then((json) => {
                self.processData(json);
            })
            .catch((msg) => {
                Log.error(msg);
            });
        if (retry) {
            self.scheduleUpdate(self.loaded ? -1 : self.config.retryDelay);
        }
    },

    getParams: function () {
        var params = "?";
        params += "Authorization=" + this.config.apiKey;
        params += "&format=" + this.config.format;
        params += "&locationName=" + this.config.locationName;
       	params += "&elementName=" + this.config.elementName;

        return params;
    },

    getDayString: function (dateTime) {
        return dateTime
            .toLocaleString(moment.locale(), { weekday: "short" })
            .substring(0, 2);
    },

    getHourString: function (time) {
		let	pattern = /(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/;
		let match	= time.match(pattern);
		return match[4];
    },

    getIconImage: function (iconId, hour) {
        let self = this;
        let iconImage = new Image(25, 25);
        if (hour < 6 || hour >= 18) {
            iconImage.src = this.config.iconURLBase + "night/" + iconId + ".svg";
        } else {
            iconImage.src = this.config.iconURLBase + "day/" + iconId + ".svg";
        }
        return iconImage;
    },


    /* scheduleUpdate()
     * Schedule next update.
     *
     * argument delay number - Milliseconds before next update.
     *  If empty, this.config.updateInterval is used.
     */
    scheduleUpdate: function (delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }
        nextLoad = nextLoad;
        var self = this;
        setTimeout(function () {
            self.getData();
        }, nextLoad);
    },

	/*
 	 * Return label, dataset (optional Range)
 	 *
 	 */
    getHourlyDataset: function () {
        const self = this;
        const cityElement	= this.weatherdata.records.locations[0];
        const secElement	= cityElement.location[0];
        const wthrElement	= secElement.weatherElement;

		const WxElements	= wthrElement[0];
		const ATElements	= wthrElement[1];
		const PoPElements	= wthrElement[2];

        // Add dummy data to make space on the left and right side of the chart
        // otherwise the icon images are cut off by y-Axes.
        const temps = [NaN],
            PoP6h = [NaN],
            iconImgs = [NaN],
            labels = [""];

		const dataLength = WxElements.time.length;
        for (let i = 0; i < Math.min(this.config.dataNum, dataLength); i++) {
        
            let ATTemp	= ATElements.time[i].elementValue[0].value;
            let PoP		= PoPElements.time[Math.floor(i/2)].elementValue[0].value;
			let hour	= this.getHourString(WxElements.time[i].startTime);

            labels.push(hour);
            temps.push(ATTemp);
            PoP6h.push(PoP);

            let iconID	= WxElements.time[i].elementValue[1].value;
			let iconImg	= this.getIconImage(iconID, parseInt(hour, 10));
            iconImgs.push(iconImg);
        }

        // Add dummy data to make space on the left and right side of the chart
        // otherwise the icon images are cut off by y-Axes.
        temps.push(NaN);
        PoP6h.push(NaN);
        iconImgs.push(NaN);
        labels.push("");


        const datasets = [];
        datasets.push({
            label: "Apparent Temp",
            borderColor: this.config.colorRed,
            pointBackgroundColor: this.config.color,
            datalabels: {
                color: this.config.color,
                align: "top",
                offset: this.config.datalabelsOffset,
                font: {
                    weight: this.config.fontWeight,
                },
                display: this.config.datalabelsDisplay,
                formatter: function (value) {
                    let place = 10 ** self.config.datalabelsRoundDecimalPlace;
                    let label = Math.round(value * place) / place;
                    return label;
                },
            },
            data: temps,
            yAxisID: "y1",
        });

		const temps2	= temps.slice(1,-1);
		const y1_min	= Math.min(...temps2) - 5;
		const y1_max	= Math.max(...temps2) + 5;


        datasets.push({
            label: "PoP6h",
            backgroundColor: this.config.fillColor,
            borderColor: this.config.colorBlue,
            borderWidth: 1,
            pointBackgroundColor: this.config.color,
            datalabels: {
                color: this.config.color,
                align: "top",
                offset: this.config.datalabelsOffset,
                font: {
                    weight: this.config.fontWeight,
                },
                display: this.config.datalabelsDisplay,
                formatter: function (value) {
                    let place =
                        10 ** self.config.datalabelsRoundDecimalPlace;
                    let label = Math.round(value * place) / place;
                    return label;
                },
            },
            data: PoP6h,
            fill: true,
            yAxisID: "y3",
        });

		const PoP6h2	= PoP6h.slice(1, -1);
		const y2_min	= y1_min;
		const y2_max	= y1_max;


        // Create dummy line for icons
        const iconLine = [NaN];
        for (let i = 0; i < temps.length-2; i++) {
            iconLine.push(y1_max-1);
        }
		iconLine.push(NaN);

        datasets.push({
            label: "Icons",
            borderWidth: 0,
            data: iconLine,
            pointStyle: iconImgs,
            datalabels: {
                display: false,
            },
            yAxisID: "y2",
        });


        const ranges = {
            y1: {
                min: y1_min,
                max: y1_max,
            },
            y2: {
                min: y2_min,
                max: y2_max,
            },
            y3: {
            	min: -10,
            	max: 200,
            },
        };

        return { labels: labels, datasets: datasets, ranges: ranges };
    },

    getDom: function () {
        var self = this;

        const wrapper = document.createElement("div");
        wrapper.setAttribute(
            "style",
            "height: " +
                this.config.height +
                "; width: " +
                this.config.width +
                ";"
        );
        if (this.weatherdata) {
            const wrapperCanvas = document.createElement("canvas"),
                ctx = wrapperCanvas.getContext("2d");

            let dataset;
            if (this.config.dataType === "hourly") {
                dataset = this.getHourlyDataset();
            } else if (this.config.dataType == "daily") {
                dataset = this.getDailyDataset();
            }

            Chart.defaults.font.size = this.config.fontSize;
            Chart.defaults.font.weight = this.config.fontWeight;
            Chart.defaults.color = this.config.color;
            Chart.register(ChartDataLabels);

            // Plugin for background color config
            // Refer:
            // https://www.chartjs.org/docs/latest/configuration/canvas-background.html#color
            const plugin = {
                id: "custom_canvas_background_color",
                beforeDraw: (chart) => {
                    const ctx = chart.canvas.getContext("2d");
                    ctx.save();
                    ctx.globalCompositeOperation = "destination-over";
                    ctx.fillStyle = this.config.backgroundColor;
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                },
            };


            if (this.chart) {
                this.chart.destroy();
            }
            this.chart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: dataset.labels,
                    datasets: dataset.datasets,
                },
                plugins: [plugin],
                options: {
                    maintainAspectRatio: false,
                    tension: this.config.curveTension,
                    title: {
                        display: true,
                        text: this.config.title,
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        x: {
                            grid: {
                                display: true,
                                borderWidth: 0,
                            },
                        },
                        y1: {
                            display: false,
                            min: dataset.ranges.y1.min,
                            max: dataset.ranges.y1.max,
                        },
                        y2: {
                            display: false,
                            min: dataset.ranges.y2.min,
                            max: dataset.ranges.y2.max,
                        },
                        y3: {
                            display: false,
							position: 'right',
                            min: dataset.ranges.y3.min,
                            max: dataset.ranges.y3.max,
                        },
                        
                    },
                    animation: { duration: 500 },
                },
            });

            this.chart.update();
            wrapper.appendChild(wrapperCanvas);
        }

        // Data from helper
        if (this.dataNotification) {
            var wrapperDataNotification = document.createElement("div");
            // translations  + datanotification
            wrapperDataNotification.innerHTML =
                "Updated at " + this.dataNotification.date;

            wrapper.appendChild(wrapperDataNotification);
        }
        return wrapper;
    },

    getScripts: function () {
        // Load chart.js from CDN
        let chartjsFileName = "chart.min.js";
        if (Number(this.config.chartjsVersion.split(".")[0]) < 3) {
            chartjsFileName = "Chart.min.js";
        }
        return [
            "https://cdn.jsdelivr.net/npm/chart.js@" +
                this.config.chartjsVersion +
                "/dist/" +
                chartjsFileName,
            "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@" +
                this.config.chartjsDatalabelsVersion +
                "/dist/chartjs-plugin-datalabels.min.js",
        ];
    },

    getStyles: function () {
        return [];
    },

    getTranslations: function () {
        return false;
    },

    processData: function (data) {
        var self = this;
        this.weatherdata = data;
        if (this.loaded === false) {
            self.updateDom(self.config.animationSpeed);
        }
        this.loaded = true;

        // the data if load
        // send notification to helper
        this.sendSocketNotification("MMM-WeatherChart-NOTIFICATION", data);
    },

    // socketNotificationReceived from helper
    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-WeatherChart-NOTIFICATION") {
            // set dataNotification
            this.dataNotification = payload;
            this.updateDom();
        }
    },
});
