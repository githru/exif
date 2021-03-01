import React, { useState, useEffect, useRef } from 'react';
import "./Detail.css";
import ValueSlider from "./ValueSlider";
import * as d3 from 'd3';
import { ClusterData, DataTypeByNameMap } from "./analyzer/GithruClasses";
import { intersection } from "lodash";
import { AttributeColors } from "./ColorClasses";
import UserInterests from "./UserIntererests";
import GitAnalyzer from "./analyzer/GitAnalyzer";
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../modules';
import Icon from '@material-ui/core/Icon';
import { AttributeIconSpecs } from './LegendIcons';
import NodeDetailList from "./NodeDetailList";
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const Detail = (props) => {
    const searchResultList = [];
    const state = useSelector(state => state);
    const { capturedSummaryInfoId, gitAnalyzer, width, seq, } = props;
console.log("detail state", capturedSummaryInfoId, state, state.capturedSummaryInfoList.filter(d => d.id === 1)[0], props);
const capturedSummaryInfo = useSelector(state => state.capturedSummaryInfoList.filter(d => d.id === capturedSummaryInfoId)[0]);
    const { clusterNodes, groupingParameters } = capturedSummaryInfo;

    const detailStatDataNames = [
        "authors",
        "keywords",
        "commitTypes",
        "clocByFiles",
        //insertionByFiles:"file",
        //deletionByFiles:"file",
        "touchCountByFiles",
        "clocByDirs",
        "touchCountByDirs",
    ];
    const initRef = useRef(false);
    const sliderWidth = state.layout.clusterOverviewSliderWidth;
    const itemNameWidth = 200;
    const detailNodesHeight = 60;
    const statHeight = 20;
    const showTopCount = 5;
    const detailNodeEdgeWidthRatio = 0.2;
    const clusterColor = clusterNodes.slice(-1)[0].color;
    const nodeList = clusterNodes.reduce( (prev, d) => prev.concat(d.cluster.nodeList), []);
    // const [clusterNodes, setClusterNodes] = useState(clusterNodes);
    const [newTh, thresholdList, firstClusterNodes] = gitAnalyzer.getClusters(groupingParameters.threshold, nodeList, 
        groupingParameters.preferenceWeights, groupingParameters.keywordFilterList, groupingParameters.releaseBinningLevel, groupingParameters.useHeuristicMerge);
    const [threshold, setThreshold] = useState(groupingParameters.threshold);
    const [currentClusters, setCurrentClusters] = useState(clusterNodes.map(d=>d.cluster));
    // const [xScale, setXScale] = useState(undefined);
    const suffix = "-" + seq;

    const dispatch = useDispatch();
    const addInterestsItems = (fragments) => {
        dispatch(actions.addItemsToCapturedSummaryInfo(fragments));
    }
    const addFragmentHistory = (fragment) => dispatch(actions.addFragmentHistory(fragment));
    const removeInterestsItem = (index) => dispatch(actions.removeItemFromCaptureSummaryInfo(index));
    const fragmentClick = (values) => {
        let [dataName, d] = values;
console.log("fragmentClick", dataName, d);
        if (capturedSummaryInfo.interestedItemList.findIndex(item => item[0] === dataName && item[1] === d) < 0) {
            addInterestsItems([[dataName, d]]);
            addFragmentHistory([dataName, d]);
        }
    }

    // visibility, left, top, nodeList, useHeuristicMerge
    const [showCommitListInfo, setShowCommitListInfo] = useState(["hidden", 0, 0, [], false]);
    const showCommitListWidth = 700;
    const closeShowCommitListInfo = () => setShowCommitListInfo(["hidden", 0, 0, [], false]);


    useEffect( () => {
        let newClusters;
        if (initRef.current === false) {
            newClusters = firstClusterNodes;
            initRef.current = true;
        } else {
            newClusters = gitAnalyzer.getClusters(threshold, nodeList, 
                    groupingParameters.preferenceWeights, groupingParameters.keywordFilterList, 
                    groupingParameters.releaseBinningLevel, groupingParameters.useHeuristicMerge)[2];
        }
console.log("???????", groupingParameters);
        detailNodeRender(newClusters, groupingParameters.useHeuristicMerge);
        setCurrentClusters(newClusters);

        closeShowCommitListInfo();
    }, [threshold]);
    

    function detailNodeRender(clusters, useHeuristicMerge) {
        if (clusters === undefined || clusters.length === 0) return;
        
        d3.select("#detailNodeSvg" + suffix).select("g").remove();
        let detailNodeSvg = d3.select("#detailNodeSvg" + suffix).append("g");

        detailNodeSvg.append("rect")
            .attr("x", itemNameWidth + 1)
            .attr("y", 0)
            .attr("width", width - sliderWidth - itemNameWidth - 1)
            .attr("height", detailNodesHeight)
            .style("stroke-width", 2)
            .style("stroke", clusterColor);
        ;

        let detailNode = detailNodeSvg.selectAll("g")
            .data(clusters)
            .enter();
        let xScale = d3.scaleBand().domain(d3.range(clusters.length)).range([itemNameWidth, width - sliderWidth])
            .paddingInner(detailNodeEdgeWidthRatio).paddingOuter(detailNodeEdgeWidthRatio / 2);

        detailNode.append("g")
            .append("rect")
            .attr("x", (d, i) => xScale(i))
            .attr("y", 5)
            .attr("width", xScale.bandwidth())
            .attr("height", detailNodesHeight - 10)
            .attr("class", "detailNode")
            .style("stroke-width", d => {
                if (intersection(d.nodeList, searchResultList).length > 0) return "2";
                else return "0";
            })
            .style("stroke", d => {
                if (intersection(d.nodeList, searchResultList).length > 0) return "red";
                else return d3.schemeCategory10[d.nodeList[0].implicitBranchNo % 10];
            })
            .style("fill", clusterColor)
            .style("fill-opacity", 0.3)
            .on("click", d => {
console.log("??22??", d, useHeuristicMerge);
                let pageX = d3.event.pageX;
                if (d3.event.pageX + showCommitListWidth > state.layout.screenWidth) {
                    pageX = state.layout.screenWidth - showCommitListWidth;
                }
                setShowCommitListInfo([
                    "visible", 
                    pageX + "px", 
                    (d3.event.pageY + 10) + "px", 
                    d.nodeList,
                    useHeuristicMerge]
                );
            })
            // .on("click", d => this.props.onClusterSummary(d));
        ;

        detailNode.append("g")
            .append("text")
            .attr("class", "detailValues")
            .attr("x", (d, i) => xScale(i) + xScale.bandwidth() - 1)
            .attr("y", detailNodesHeight - 7)
            .attr("text-anchor", "end")
            // .text(d => "ⓒx" + d.nodeList.length);
            .text(d => d.nodeList.length)// + (dataName.startsWith("cloc") ? "L" : ""))
        ;

        let nodeLine = detailNodeSvg.selectAll("g .nodeLine")
            .data(clusters.slice(0, -1))
            .enter()
            .append("g")
            .append("line")
            .attr("x1", (d, i) => xScale(i) + xScale.bandwidth())
            .attr("x2", (d, i) => xScale(i + 1))
            .attr("y1", detailNodesHeight / 2)
            .attr("y2", detailNodesHeight / 2)
            .style("stroke-width", 5)
            .style("stroke", clusterColor)
            .style("stroke-opacity", 0.5)
            ;

        detailStatRender(clusters);

        return xScale;
    }
    
    function detailStatRender(clusters) {
        if (clusters === undefined || clusters.length === 0) return;
console.log("detailStatRender ----", clusters);

        let clusterAttrDivPrefix = "clusterAttrDiv";
        d3.select("#detailNodeStatDiv" + suffix).selectAll("svg").remove();
        let xScale = d3.scaleBand().domain(d3.range(clusters.length)).range([0, width - sliderWidth - itemNameWidth])
                .paddingInner(detailNodeEdgeWidthRatio).paddingOuter(detailNodeEdgeWidthRatio / 2);
// console.log("corpusData", gitAnalyzer.corpusData);
        let clusterDataMapByClusterId = clusters.reduce( (prev, cur, i) => {
                    prev[cur.id] = new ClusterData(cur, gitAnalyzer.corpusData);
                    return prev;
        }, {});

        detailStatDataNames.forEach( (dataName, index) => {
            // if (!(dataName in AttributeColors)) return;

            let eachClusterStatListSortedByValue = clusters.map(d => 
                attrValueMapToSortedList(dataName, clusterDataMapByClusterId[d.id][dataName])
                    //.filter( (d, i) => i < this.showTopCount)
            );
            let keyMap = eachClusterStatListSortedByValue.reduce( (prevMap, stat) => {
                return stat.reduce( (prev, cur) => {
                    // [key, value, sum]
                    if (cur[0] in prev) prev[cur[0]] += +cur[1];
                    else prev[cur[0]] = +cur[1];
                    return prev;
                }, prevMap);
            }, {});
            let sortedAllValues = Object.keys(keyMap).map(k => [k, keyMap[k], []]);
            // sort by name => by value
            sortedAllValues.sort((a, b) => b[0] - a[0]);
            // if (dataName === "keywords") {
            //     sortedAllValues = sortedAllValues.sort((a, b) => b[1][1] - a[1][1])
            //         .map( d => [d[0], d[1][0]], []);
            // } else {
                sortedAllValues.sort((a, b) => b[1] - a[1]);
            // }
// console.log("sortedAllValues", dataName, sortedAllValues)

            let topKeys = sortedAllValues.filter( (d, i) => i < showTopCount);
            let statTotalHeight = statHeight * topKeys.length;
            let yScale = d3.scaleBand().domain(d3.range(topKeys.length)).range([0, statTotalHeight - 2]);
            
            let colorArray = AttributeColors[DataTypeByNameMap[dataName]];
            let attrColorScale = d3.scaleLinear().range([ colorArray[3], colorArray[0]]).domain([topKeys.length, 0]);
        
            let heads = d3.select("#clusterAttrHeadDiv" + index + suffix)
                .append("svg")
                .style("width",  width - itemNameWidth)
                .style("height", statTotalHeight)
                .selectAll("rect")
                .data(topKeys)
                .enter()
            ;
            const highlightDataItem = (i) => {
                d3.select("." + dataName + "Header" + i + suffix)
                    .style("stroke", "blue")
                    .style("stroke-width", "2px");

                d3.selectAll("." + dataName + "Item" + i)
                    .style("stroke", "blue")
                    .style("stroke-width", "2px");
            }
            const rollBackHighlightDataItem = (i) => {
                let nodes = d3.selectAll("." + dataName + "Item" + i);
                if (nodes.size() > 0) {
                    nodes.style("stroke", nodes.style("fill"))
                        .style("stroke-width", "1px");
                }
                d3.select("." + dataName + "Header" + i + suffix)
                    .style("stroke-width", "0");
            }
            const hover = (event) => {
                d3.event.target.style.textDecoration = "underline";
                d3.event.target.style.fill = "red";
            }
            const hout = event => {
                d3.event.target.style.textDecoration = "";
                d3.event.target.style.fill = "";
            }

            heads.append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => yScale(i))
                .attr("width", itemNameWidth)
                .attr("height", d => yScale.bandwidth())
                .attr("class", (d, i) => dataName + "Header" + i + suffix)
                .style("fill", (d, i) => attrColorScale(i))
                .style("stroke-width", 0)
                .style("fill-opacity", 0.5)
                .on("mouseenter", (d, i) => highlightDataItem(i))
                .on("mouseout", (d, i) => rollBackHighlightDataItem(i))
            ;
            heads.append("text")
                .attr("x", itemNameWidth - 5)
                .attr("y", (d, i) => yScale(i) + yScale.bandwidth() - 4)
                .attr("text-anchor", "end")
                .style("cursor", "pointer")
                .text(d => GitAnalyzer.getTextValue(dataName, d[0]))
                // .attr("class", d => {
                //     if (this.state.keywords.filter(keyword => d[0].toLowerCase().indexOf(keyword) >= 0).length > 0) return "attrHeadText matchedText";
                //     else return "attrHeadText";
                // })
                .on("mouseenter", (d, i) => {highlightDataItem(i);hover();})
                .on("mouseout", (d, i) => {rollBackHighlightDataItem(i);hout();})
                .on("click", d => {
                    fragmentClick([dataName, d[0]]);
                })
            ;

            let dataSvg = d3.select("#" + clusterAttrDivPrefix + index + suffix)
                .append("svg")
                    .style("width",  width - itemNameWidth)
                    .style("height", statTotalHeight)
            ;
            let prevItems = topKeys.map(d => d[0]);

            const changeTextOver = (node, txt) => {
                d3.select(node).select("text").text(txt)
                    .style("font-weight", "400")
                    .style("z-index", 100);
            }
            const changeTextOut = (node, txt) => {
                d3.select(node).select("text").text(txt)
                    .style("font-weight", "")
                    .style("z-index", "");
            }
            d3.range(clusters.length).forEach(clusterIndex => {
                let valueList = eachClusterStatListSortedByValue[clusterIndex].slice(0, showTopCount);
                let colors = [];
                let clusterData = dataSvg.append("g")
                    .attr("id", "g" + clusterIndex)
                    .selectAll("rect")
                    .data(valueList)
                    .enter()
                    .append("g")
                ;
// console.log("valueList", valueList);
                clusterData
                    .append("rect")
                    // .attr("class", "clusterDataItem")
                    .attr("x", xScale(clusterIndex))
                    // .attr("y", d => yScale(d[2] - d[1]))
                    .attr("y", (d, i) => yScale(i))
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => yScale.bandwidth())
                    .attr("id", d => d[0] + "," + d[1] + "," + d[2])
                    .style("stroke", (d, i) => {
                        let pos = topKeys.map(d => d[0]).indexOf(d[0]);
                        let color;
                        if (pos > -1) color = attrColorScale(pos);
                        else color = "efebe9";
                        colors.push(color);
                        return color;
                    })
                    .style("fill", (d, i) => colors[i])
                    .style("fill-opacity", 0.5)
                    .attr("class", d => dataName + "Item" + topKeys.map(d => d[0]).indexOf(d[0]))
                    .on("mouseenter", function (d) {
                        changeTextOver(this.parentNode, d[0]);
                    })
                    .on("mouseleave", function (d) {
        console.log("changeTextOut", d, dataName); 
                        changeTextOut(this.parentNode, d[1] + (dataName.startsWith("cloc") ? "L" : ""));
                    })
                ;
                clusterData.append("text")
                    .attr("class", "clusterDataItemValues")
                    .attr("x", xScale(clusterIndex) + xScale.bandwidth())
                    .attr("y", (d, i) => yScale(i) + yScale.bandwidth() - 2)
                    .attr("text-anchor", "end")
                    .text(d => d[1] + (dataName.startsWith("cloc") ? "L" : ""))
                    .on("mouseenter", function (d) {
                        changeTextOver(this, d[0]);
                    })
                    .on("mouseleave", function (d) { 
                        changeTextOut(this, d[1] + (dataName.startsWith("cloc") ? "L" : ""));
                    })
                ;
                let curItems = valueList.map(d => d[0]);
                prevItems.forEach( (item, i) => {
                    let pos = curItems.indexOf(item);
                    if (pos === -1) return;
                
                    let dataset = {
                        source: {
                            x: (clusterIndex === 0 ? 0 : xScale(clusterIndex - 1) + xScale.bandwidth()),
                            y: yScale(i) + yScale.bandwidth() / 2
                        },
                        target: {
                            x: xScale(clusterIndex),
                            y: yScale(pos) + yScale.bandwidth() / 2
                        }
                    };
                    let link = d3.linkHorizontal().x(d => d.x).y(d => d.y);
                    dataSvg.append("g")
                        .append("path")
                        .datum(dataset)
                        .attr("class", "line linkCurveLine")
                        .attr("d", link)
                        .style("stroke", colors[pos])
                        .style("fill-opacity", "0.5")
                    ;
                });
                prevItems = curItems;
            });
        });
    }

    function attrValueMapToSortedList(dataName, map, dirDepth = 3) {
        let sum = 0;
        let mapList = Object.keys(map)
            .filter(k => !(dataName.endsWith("Dirs") && k.split("/").length !== dirDepth))
            .map(k => [k, map[k]])
            // .map(k => {
            //     let v = map[k];
            //     if (dataName.endsWith("Files")) {
            //         let ks = k.split("/");
            //         k = ks.slice(-1)[0];
            //         if (ks.length > 1) k = ".../" + k;
            //     }
            //     return [k.split(" <")[0], v];
            // });
        ;
// console.log("mapList", mapList);
        // sort by name => value
        mapList.sort( (a, b) => (b[0] - a[0]));
        if(dataName != "keywords") mapList.sort((a, b) => b[1] - a[1]);
        else mapList = mapList.sort((a, b) => b[1][1] - a[1][1]).map(d => [d[0], d[1][0]]);
        // mapList.sort( (a, b) => (b[1] - a[1]));
        mapList = mapList.map(d => {
            sum += +d[1];
            return [...d, sum];
        });
// console.log("mapList2", mapList)

        return mapList;
    }

    return (
        <div id={"detailTabPanel" + seq} className="flexVerticalContainer detailTabPanel"
            style={{width:width, display:"none",}}
        >
            <div id="title-panel" style={{width:width}}>
                <div id="repository-name">
                    INSPECTION (#{props.capturedSummaryInfoId})
                </div>
                <div id="legend-container">
                    {[ "authors", "keywords", "commitTypes", "clocByFiles", "clocByDirs" ].map((d, i) => {
                    let color = AttributeColors [ DataTypeByNameMap[d] ][ 3 ];
                    return (
                        <div key={i} className="legend-element" style={{
                            background: color,
                        }}>

                            <Icon>{AttributeIconSpecs[ d ]}</Icon>
                            <span>{d.split("clocBy").slice(-1)[ 0 ]}</span>

                        </div>
                        );
                    })}
                </div>
            </div>
            <div style={{width:width, height:"50px"}} />
            <div style={{width:width}} className="flexContainer">
                <div id={"detailValueSliderDiv" + suffix} width={sliderWidth + "px"} align="right"
                    style={{marginRight: "10px"}}
                >
                    <ValueSlider 
                        index={seq}
                        name={"detail"}
                        defaultStepValue={0}
                        threshold={threshold}
                        thresholdList={thresholdList}
                        width={sliderWidth}
                        height="200"
                        changeThreshold={ (th) => {
                            console.log("changed!!", threshold, th)
                            setThreshold(th)
                        } } />
                </div>
                <div>
                    <svg id={"detailNodeSvg" + suffix} width={width - sliderWidth} height={detailNodesHeight} />
                    {currentClusters !== undefined && currentClusters.length > 0 && 
                        <UserInterests
                            index={seq}
                            clusters={currentClusters} 
                            itemNameWidth={itemNameWidth}
                            width={width}
                            checkSvgWidth={width - sliderWidth - itemNameWidth - 1}
                            itemHeight={statHeight}
                            clusterColor={clusterColor}
                            
                            interestedItemList={capturedSummaryInfo.interestedItemList}
                            keywords={[]}
                            sliderWidth={sliderWidth}
                            detailNodeEdgeWidthRatio={detailNodeEdgeWidthRatio}
                            removeInterestsItem={removeInterestsItem}
                        /> 
                    }
                    <div id={"detailNodeStatDiv" + suffix}>
                        {Object.keys(DataTypeByNameMap).map((item, i) => (
                            <div className="clusterData" key={i}>
                                <div id={"clusterAttrHeadDiv" + i + suffix} className="clusterDataHeader" style={{ "width": itemNameWidth }} />
                                <div id={"clusterAttrDiv" + i + suffix}></div>
                            </div>
                        ))}
                    </div>
                    <svg id={"detailBlockSvg" + suffix} width={width - sliderWidth} height={detailNodesHeight} />
                    <div id={"detailNodeCommitList" + suffix} 
                        style={{ 
                            position: "absolute",
                            border: "2px solid #EEEEEE",
                            background: "#FFFFFF",
                            overflowY: "auto",
                            width: showCommitListWidth + "px",
                            visibility: showCommitListInfo[0],
                            left: showCommitListInfo[1],
                            top: showCommitListInfo[2]
                        }
                    }>
                        <div>
                            <IconButton
                                size="small"
                                variant="outlined"
                                onClick={closeShowCommitListInfo}
                            >
                                <CloseIcon 
                                    fontSize="small"
                                />
                            </IconButton>
                        </div>
                        { (showCommitListInfo[3].length > 0 ?
                            <NodeDetailList
                                gitAnalyzer={gitAnalyzer}
                                nodeList={showCommitListInfo[3]}
                                registerFavoriteFragment={fragmentClick}
                                useHeuristicMerge={showCommitListInfo[4]}
                            />
                            : "")
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Detail;