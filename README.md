# MMM-TW-Weather

Hourly Forecast (temperature, weather icons on the top, rain volume on the bottom)

![image](./screenshot.jpg)

MagicMirror module for displaying weather forecasts from [OpenWeather](https://openweathermap.org/). Weather forecasts are displayed by using [Chart.js](https://www.chartjs.org/), an open-source free library for drawing charts.

This module can work with free OpenWeather API, which only requires to sign up and get an API key.

## Installation

Clone this repository and place it on MagicMirror module directory.

```
$ cd ~/MagicMirror/modules
$ git clone https://github.com/jungleson/MMM-TW-Weather.git
```

or if you want to use an old version, clone it with the version.
```
$ cd ~/MagicMirror/modules
$ git clone -b <version> https://github.com/jungleson/MMM-TW-Weather.git
```

## Configuration

### Configuration Example

```
   modules: [
        {
            module: "MMM-TW-Weather",
            header: "Weather Forecast",
            position: "top_right",
            config: {
                apiKey: "<your-openweather-api_key>",
                dataid: "F-D0047-053",
                locationName: "東區",
                dataNum: 12,
                height: "250px",
                width: "350px",
            }
        }
   ]
```

### Configuration Options

| Options | Required | Default | Description |
|:--------|:--------:|:--------|:------------|
| apiKey | yes | | API key to call [OpenWeather](https://openweathermap.org/) API. You can get the API key by signing up [OpenWeather](https://openweathermap.org/). |
| height | | `300px` | Height of the chart area in px |
| width | | `500px` | Width of the chart area in px |
| title | | `Weather Forecast` | Title of the chart to display |
| dataid | | `F-D0047-053` | ID of the city |
| locationid | | `東區` | District name |


