"use strict";

var App = App || {};

// bar chart that compares number of people between West Englewood and Englewood for a given category
function CensusBarChart(propertyData, propertyDataID, customTitle) {
    let self = {
        title: (() => {
            if (propertyData.title) {
                return `<h4><b>${propertyData.title}</b></h4>`;
            } else {
                let mainTypeTitle = propertyData.mainType.split("_").map((d) => { return `${d[0].toUpperCase()}${d.slice(1).toLowerCase()}`; }).join(" ");
                return `<h4><b>${mainTypeTitle}:</b> ${propertyData.subType.replace(/[^a-zA-Z0-9- ]/g, "")}</h4>`;
            }
        })(),
        id: propertyDataID,
        barChart: null,
        selections: [
            App.models.aggregateData.westEnglewood,
            App.models.aggregateData.englewood
        ]
    };

    function init(chartPanel) {
        self.barChart = new BarChart();

        self.barChart.init(chartPanel.select(".panel-body"));
    }

    function update() {
        let data = self.selections.map(selection => {
            let propertyValue = 0;

            try {
                propertyValue = selection.data.census[propertyData.mainType][propertyData.subType];
            } catch (err) {
                console.error(err);
            }

            return {
                value: propertyValue || 0,
                color: selection.color,
                name: selection.id,
                bounds: selection.bounds
            };
        });

        self.barChart.update(data);
    }

    function remove(skipReset) {
        console.debug("Removing census bar chart for", self.title);
        if(!skipReset){
            App.controllers.mapData.resetFilters(true);
        }
    }

    return {
        title: self.title,
        id: self.id,
        init,
        update,
        remove
    };
}
