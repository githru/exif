import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import './ClusterWOTime.css';
import coData2 from './json/realm-java.co.json';
import { Button } from '@material-ui/core';
import { CommitCluster } from './GithruClasses';

const hover = (event) => {
    // d3.event.target.style.textDecoration="underline";
    d3.event.target.style.fill = "red";
}
const hout = event => {
    // d3.event.target.style.textDecoration="";
    d3.event.target.style.fill = "";
}

class ClusterWOTime extends React.Component {
    static defaultR = 1;
    static selectedR = 3;

    constructor(props) {
        super(props);

        this.state = {
            selectedCommits: [],
        };
    }

    componentDidMount() {
        const margin = {top: 10, right: 10, bottom: 20, left: 10};
        // let width = props.width - margin.left - margin.right;
        // let height = props.height - margin.top - margin.bottom;
console.log("only once!!!")
// let coData = coData2.slice(0, 500);
let coData = coData2;
        let xScale = d3.scaleLinear().range([margin.left, this.props.width - margin.right]).domain(d3.extent(coData, d=>d[0]));
        let yScale = d3.scaleLinear().range([margin.top, this.props.height - margin.bottom]).domain(d3.extent(coData, d=>d[1]));
console.log("x ext", d3.extent(coData, d=>d[0]));
console.log("y ext", d3.extent(coData, d=>d[1]));
        // let xAxis = d3.axisBottom(xScale);
        // let yAxis = d3.axisLeft(yScale);
        
        let coSvg = d3.select("#coSvg").append("g")
            .attr("class", "circleG")
            .selectAll("circle")
            .data(coData)
            .enter()
        coSvg.append("circle")
            .attr("id", (d, i) => "dot" + i)
            .attr("class", "dot")
            .attr("r", ClusterWOTime.defaultR)
            .attr("cx", d => xScale(d[0]))
            .attr("cy", d => yScale(d[1]))
            .on("mouseover", hover)
            .on("mouseout", hout)
            .on("click", (d, i) => {
                console.log("click", i, d);
                this.props.onCommitSelectedWOTime(i)})
        ;

        // function brushended() {
        //     console.log("wowowo", "brush ended")

        //     if (!d3.event.selection) {
        //         d3.select("#coSvg").selectAll('circle')
        //             .transition()
        //             .duration(150)
        //             .ease(d3.easeLinear)
        //             .style("fill", "#4292c6");
        //     }
        // }

        let brush = d3.brush().extent([
                [xScale.range()[0], yScale.range()[0]], 
                [xScale.range()[1], yScale.range()[1]]
        ]);
console.log("wowowowo", [xScale.range()[0], yScale.range()[0]], [xScale.range()[1], yScale.range()[1]]);
        d3.select("#coSvg").append("g")
            // .attr("id", "woTimeBrush")
            .attr("class", "woTimeBrush")
            .call(brush)
        brush
            // .on("brush", brushed)
            .on("end", () => {
                if (d3.event.selection === null) return;
                console.log("wowowo", "brush called")
                var s = d3.event.selection,
                    x0 = s[0][0],
                    y0 = s[0][1],
                    dx = s[1][0] - x0,
                    dy = s[1][1] - y0;
                // console.log(s);

                let cluster = new CommitCluster();
                d3.select("#coSvg").selectAll('circle')
                    .style("fill", (d, i) => {
                        if (xScale(d[0]) >= x0 && xScale(d[0]) <= x0 + dx
                            && yScale(d[1]) >= y0 && yScale(d[1]) <= y0 + dy) {
                            let commitNo = this.props.gitAnalyzer.allNodeList.length - i - 1;
                            cluster.nodeList.push(this.props.gitAnalyzer.allNodeList[commitNo]);
                            return "#ec7014";
                        } else { return "#black"; }
                    });
                this.props.onClusterSummary(cluster);
            });
            
        
        // d3.select("#coSvg").append("g")
        //     .attr("transform", "translate(0," + (props.height - margin.bottom) + ")")
        //     .call(xAxis)
        // ;

        // d3.select("#coSvg").append("g")
        //     .attr("transform", "translate(" + (margin.left) + ", 0)")
        //     .attr("class", "y axis")
        //     .call(yAxis)
        // ;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
console.log("getDerivedStateFromProps", nextProps, prevState);

        if (nextProps.selectedCommits !== undefined && nextProps.selectedCommits !== prevState.selectedCommits) {
            ClusterWOTime.resetAndHighlight(nextProps);

            return {
                ...prevState,
                selectedCommits: nextProps.selectedCommits,
            }
        }

        return prevState;
    }

    static resetAndHighlight(props) {
console.log("resetAndHighlight", props);
        d3.select("#coSvg").selectAll(".selectedDot").attr("class", "dot").attr("r", ClusterWOTime.defaultR);
        props.selectedCommits.forEach( commit => {
            let no = commit.no;//coData.length - commit.no + 1
            d3.select("#dot" + no)
                .attr("class", "selectedDot") 
                .attr("r", ClusterWOTime.selectedR);
        });
    }

    render() {
        return (
            <div className="flexVerticalContainer">
                <svg id="coSvg" width={this.props.width} height={this.props.height}
                    style={{ "background": "#fafafa", "opacity": "0.95" }}
                />
                <div className="flexContainer" style={{ width: "100%", justifyContent: "space-between", height:"25px" }}>
                    <div></div>
                    <div>
                        {/* <Button style={{ "fontSize": "11px" }} size="small" variant="outlined" onClick={this.resetClusterSelections}>
                            RESET
                        </Button> */}
                        <Button style={{ "fontSize": "11px" }} size="small" variant="outlined" 
                                onClick={() => {
                                }}>
                            ADD DETAILS
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    shouldComponentUpdate(nextProps, prevState) {
        return nextProps.selectedCommits !== undefined && nextProps.selectedCommits !== prevState.selectedCommits;
    }
}

export default ClusterWOTime;