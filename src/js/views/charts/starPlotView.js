"use strict";

// starplot config referenced from https://github.com/kevinschaul/d3-star-plot

let StarPlotView = function(options){
    let self = {
        parent: undefined, //parent element
        name: undefined,
        width: undefined,
        height: undefined,
        margin: {
            top: 0, bottom: 0,
            left: 0, right: 0
        },
        titleMargin: {
            top: 0, bottom: 0,
            left: 0, right: 0
        },
        plotFn: undefined,
        svg: undefined,
        svgGroup: {},
        interaction: false
    };

    function init() {
        const plotRange = [d3.starPlot().zeroValue(),100];

        self.parent = options.parent; //parent element as a d3 selection
        self.svg = options.svg; //optional, as a new svg will be created if not specified
        self.name = options.name;
        self.height = options.height;
        self.width = options.width;
        self.interaction = options.interaction || false;
        self.rotate = options.rotate || 0;
        if(options.margin){
            for(let p of Object.keys(self.margin)){
                self.margin[p] = options.margin[p] || self.margin[p];
            }
        }

        if (options.titleMargin) {
            for (let p of Object.keys(self.titleMargin)) {
                self.titleMargin[p] = options.titleMargin[p] || self.titleMargin[p];
            }
        }

        /*
            options.axes = [
                {
                    min: <min val>,
                    max: <max val>,
                    label: <custom label> //optional
                    propertyName: <property-name> // name of axis
                }
            ]
        */
        let properties = [], scales = [], labels = [];
        for(let a of options.axes){
            properties.push(a.propertyName);

            let axisScale;
            
            axisScale = d3.scaleLinear()
                .domain([a.min, a.max])
                .range(plotRange);
            if(a.logScale){
                let linearScale = d3.scaleLinear()
                    .domain([a.min, a.max]).range([1,10]);
                let logScale = d3.scaleLog().range(plotRange); // domain is [1,10]
                axisScale = (value) => logScale(linearScale(value));
            }else{
                axisScale = d3.scaleLinear()
                    .domain([a.min, a.max])
                    .range(plotRange);
            }
            scales.push(axisScale);
            labels.push(a.label || a.propertyName);
        }
        self.plotFn = d3.starPlot()
            .rotate(options.rotate || 0)
            .properties(properties) //array of strings corresponding to properties of dataum
            .scales(scales)
            .labels(options.labels || labels)
            .includeGuidelines(false)
            .includeLabels(false)
            .includeChart(true)
    };

    init();

    /*
        data = {
            propertyName1: value,
            propertyName2: value,
            ...
        }
    */
    function render(data, groupID, fillColor) {

        groupID = groupID || "chart-outline"; // default to chart outline

        if(!self.svg){
            self.svg = self.parent.append("svg")
                .attr("width", self.width).attr("height", self.height)
                .style("width", self.width).style("height", self.height);
        }
        if(self.svgGroup[groupID]){
            self.svgGroup[groupID].remove();
        }
        self.svgGroup[groupID] = self.svg.append('g').attr("id","starplot-" + self.name);

        if(groupID === 'chart-outline'){
            let group = self.svgGroup[groupID].datum({})
                .call(
                    self.plotFn
                        .includeGuidelines(true)
                        .includeLabels(true)
                        .includeChart(false)
                )
                    .style("transform", `translateX(${self.margin.left - self.margin.right}px) translateY(${self.margin.top - self.margin.bottom}px)`)
                .select(".star-title")
                    .style("transform", `translateX(${self.titleMargin.left - self.titleMargin.right}px) translateY(${self.titleMargin.top - self.titleMargin.bottom}px)`);
        }else if(data){
            let group = self.svgGroup[groupID].datum(data)
            .call(
                self.plotFn
                    .includeGuidelines(false)
                    .includeLabels(false)
                    .includeChart(true)
            )
                    .style("transform", `translateX(${self.margin.left - self.margin.right}px) translateY(${self.margin.top - self.margin.bottom}px)`);
            
            group.select(".star-title")
                    .style("transform", `translateX(${self.titleMargin.left - self.titleMargin.right}px) translateY(${self.titleMargin.top - self.titleMargin.bottom}px)`);

            if(fillColor){
                self.svgGroup[groupID].select("path.star-path")
                    .style('fill', fillColor).style('fill-opacity', '0.35')
                    .style('stroke', fillColor).style('stroke-opacity', 1)
                    .style('stroke-width', '2px');

                self.svgGroup[groupID].selectAll(".data-point")
                    .style('fill', fillColor);
            }

            if(self.interaction){
                console.debug("Adding interaction to star plot");
                group.call(self.plotFn.interaction);
            }
        }else{
            let $svg = $(self.svg.node());
            self.svgGroup[groupID].append("text").text("Select a block to show data")
                .attr("text-anchor", "middle")
                .style("transform", `translateX(${$svg.width() / 2}px) translateY(${$svg.height() / 2}px)`);
        }
    }

    function raiseGroup(groupID) {
        self.svgGroup[groupID].raise();
    }

    return {
        render,
        raiseGroup
    };
};
