"use strict";

// star plot that shows the distribution of vacant lot types of a given selection
function VacantLotStarPlot(id, title, dataRanges) {
    let self = {
        title: title,
        id: id,
        starPlot: null,
        // zone names referenced from https://secondcityzoning.org/zones/
        axes: [
            {
                propertyName: "Residential",
                min: dataRanges.Residential[0],
                max: dataRanges.Residential[1],
            },
            {
                propertyName: "BCM",
                label: "Business, Commmercial, Manufacturing",
                min: dataRanges.BCM[0],
                max: dataRanges.BCM[1],
            },
            {
                propertyName: "POS",
                label: "Parks and Open Space",
                min: dataRanges.POS[0],
                max: dataRanges.POS[1],
            },
            {
                propertyName: "PD",
                label: "Planned Manufacturing Districts and Development",
                min: dataRanges.PD[0],
                max: dataRanges.PD[1],
            },
        ]
    };

    function init(chartPanel) {
        console.log(self.axes);
        self.starPlot = new StarPlotView({
            parent: chartPanel.select(".panel-body"),
            name: id,
            width: '100%',
            height: '300px',
            margin: {
                top: 50,
                left: 90
            },
            axes: self.axes,
            // interaction: true
        });
    }

    function update(panel,data){
        if(data){
            panel.style("display", null);
            self.starPlot.render(data);
        }else{
            panel.style("display", "none"); // hide on no data
        }
    }

    return {
        title: self.title,
        id: self.id,
        init,
        update
    }
}