import React, { useEffect, useRef, Fragment, } from 'react';
import { Table, TableRow, TableCell, TableBody, Hidden } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import * as d3 from 'd3';
import { getScoreColor, AttributeColors, BranchColors } from './ColorClasses';
import { PreferenceList, ClusterData, DataTypeByNameMap, BranchTypes } from './analyzer/GithruClasses';
import GitAnalyzer from './analyzer/GitAnalyzer';

const hover = (event) => {
    event.target.style.textDecoration = "underline";
    event.target.style.fontWeight = "bold";
    // event.target.style.color = "red";
    // event.target.style.fill = "red";
}
const hout = event => {
    event.target.style.textDecoration = "";
    event.target.style.color = "";
    event.target.style.fill = "";
    event.target.style.fontWeight = "400";
}

const useStyles = makeStyles(theme => ({
    table: {
        padding: 1,
    },
    tableCell: {
        fontSize: "12px",
        paddingLeft: 2,
        paddingRight: 1,
        paddingTop: 2,
        paddingBottom: 2,
        verticalAlign: "text-top",
        minWidth: "40px"
    },
    nodeList: {
        display: "flex",
        flexDirection: "column",
        maxHeight: "450px",
        maxWidth: "100%",
        overflowY: "auto",
    },
    bar: {
        padding: 0,
    },
    div: {
        font: "14px bold"
    },
    vseparator: {
        width: "100%",
        height: "10px"
    },
}));

const MessagePrint = (props) => {
    let message = (props.message !== undefined && props.message !== null ? props.message : "");

    return (
        <div style={{ display: "flex", flexWrap: "wrap", fontSize: "10px", marginLeft: props.marginLeft }}>
            {message.trim().split("\n").map((line, li) =>
                <Fragment key={li}>
                    {line.trim() !== "" && line.trim().split(" ").map((word, i) => (
                        <div key={i} style={{ display: "inline", cursor: "pointer", }}>
                            <span
                                onMouseOver={hover}
                                onMouseOut={hout}
                                onClick={() => props.registerFavoriteFragment(["message", word])}
                            >
                                {word}
                            </span>
                &nbsp;
                        </div>
                    ))}
                    {line.trim() !== "" && <br />}
                </Fragment>
            )}
        </div>
    );
}

const NodeDetail = (props) => {
    const classes = useStyles();
    const { node, parentNode, registerFavoriteFragment, gitAnalyzer } = props;
    // console.log("NodeDetail", props);
    const isParent = (parentNode === undefined && node.mergeNodes.length > 0);
    const isChild = (parentNode !== undefined);
    const className = (isChild ? "commitChildRow" + parentNode.seq : "commitRow" + node.seq);

    const toggleRowShow = () => {
        let childClass = "." + "commitChildRow" + node.seq;
        // console.log("togrowshow", d3.select(childClass).style("visibility"));
        let visible = d3.select(childClass).style("visibility") === "visible";

        d3.selectAll(childClass).style("visibility", (visible ? "collapse" : ""));
    }

    return (
        <TableRow
            className={"flexContainer " + className}
            style={{ visibility: (isChild ? "collapse" : "") }}
        >
            {props.useHeuristicMerge && (
                <TableCell className={classes.tableCell} style={{ width: "40px", cursor: "pointer" }}>
                    <div align="center"
                        onClick={isParent ? toggleRowShow : undefined}
                    // onClick = {parentNode !== undefined ? () => toggleRowShow : undefined}
                    >
                        {isChild ? "+" :
                            (isParent &&
                                <u>CM({node.mergeNodes.length})</u>
                            )
                        }
                    </div>
                    {/* <div>{(hasMergeNodes ? "M(" + node.mergeNodes.length + ")" : (isMergeNode ? "⎿" : ""))}</div> */}
                </TableCell>
            )}
            {!props.useHeuristicMerge && (
                <TableCell className={classes.tableCell} style={{ width: "40px", }}>
                    <div align="center">
                        {node.isMergeTraversed && node.mergedToNode !== undefined &&
                            <Fragment>
                                CMed
                  <br />
                                <span style={{ fontSize: "8px" }}>({node.mergedToNode.id.substring(0, 7)})</span>
                            </Fragment>
                        }
                    </div>
                    {/* <div>{(hasMergeNodes ? "M(" + node.mergeNodes.length + ")" : (isMergeNode ? "⎿" : ""))}</div> */}
                </TableCell>
            )}
            <TableCell className={classes.tableCell}>
                <div
                    style={{ width: "55px", fontSize: "10px", cursor: "pointer" }}
                    onMouseOver={hover}
                    onMouseOut={hout}
                    onClick={() => registerFavoriteFragment(["id", node.commit.id.substring(0, 6)])}
                >#{node.commit.id.substring(0, 6)}</div>
            </TableCell>
            <TableCell className={classes.tableCell}>
                <div
                    style={{ width: "55px", fontSize: "10px" }}
                // onMouseOver={hover}
                // onMouseOut={hout}
                // onClick={() => registerFavoriteFragment(["date", node.commit.date])}
                >{GitAnalyzer.getTextValue("date", GitAnalyzer.trimYYYYMMDD(node.commit.date)).substring(2, 10)}</div>
            </TableCell>
            <TableCell className={classes.tableCell} style={{ cursor: "pointer" }}>
                <div
                    style={{}}
                    onMouseOver={hover}
                    onMouseOut={hout}
                    onClick={() => registerFavoriteFragment(["authors", node.commit.author])}
                >
                    {/* {GitAnalyzer.getTextValue("authors", node.commit.author)} */}
                    {GitAnalyzer.getTextValue("authors#2", node.commit.author)}
                </div>
            </TableCell>
            <TableCell className={classes.tableCell} >
                <div
                    style={{ width: "30px", fontSize: "10px", cursor: "pointer" }}
                    onMouseOver={hover}
                    onMouseOut={hout}
                    onClick={() => registerFavoriteFragment(["commitTypes", node.commit.commitType])}
                >{GitAnalyzer.getTextValue("commitTypes", node.commit.commitType).substring(0, 3)}</div>
            </TableCell>
            <TableCell className={classes.tableCell}>
                <div className="flexVerticalContainer">
                    <MessagePrint message={node.commit.message} registerFavoriteFragment={registerFavoriteFragment} />
                    {node.pullRequestHeads.map((prNum, i) => {

                        let { message, body, state, merged } = gitAnalyzer.pullMapByNumber[prNum];
                        let closed = (state === "closed");
                        let type;

                        if (merged) {
                            type = BranchTypes.PR_MERGED;
                        } else if (closed) {
                            type = BranchTypes.PR_CLOSED;
                        } else {
                            type = BranchTypes.PR_OPEN;
                        }

                        return (
                            <React.Fragment key={i}>
                                <div style={{ fontWeight: "900", color: BranchColors[type] }}>[Pull Request #{prNum}] - {type.substring(3, type.length)}</div>
                                {message !== undefined && message !== null && message.trim() !== "" &&
                                    <MessagePrint marginLeft={10} message={message} registerFavoriteFragment={registerFavoriteFragment} />
                                }
                                {body !== undefined && body !== null && body.trim() !== "" &&
                                    <MessagePrint marginLeft={10} message={body} registerFavoriteFragment={registerFavoriteFragment} />
                                }
                            </React.Fragment>
                        );
                    })}
                </div>
            </TableCell>
            <TableCell className={classes.tableCell} >
                <div
                    style={{ width: "80px", wordBreak: "break-word", }}
                // onMouseOver={hover}
                // onMouseOut={hout}
                >
                    {node.commit.tags !== undefined && node.commit.tags.length > 0 && GitAnalyzer.getTextValue("tags", node.commit.tags.join(", "))}
                    {node.commit.tags !== undefined && node.commit.tags.length > 0 && <br />}
                    {node.commit.branches !== undefined && GitAnalyzer.getTextValue("branches", node.commit.branches.map(b => (b.startsWith("origin/") ? b.split("origin/")[1] : b)).join(", "))}
                </div>
            </TableCell>
            {/* <TableCell className={classes.tableCell} style={{ width: "50px" }}>
          <div
            onMouseOver={hover}
            onMouseOut={hout}
          >{node.commit.branches !== undefined && GitAnalyzer.getTextValue("branches", node.commit.branches.join(", "))}</div>
        </TableCell> */}
        </TableRow>
    )
}

export const NodeDetailList = (props) => {
    const classes = useStyles();
    const { nodeList, gitAnalyzer, } = props;
// console.log("NodeDetailList props", props);
    return (
        <Table size="small" className={classes.table}>
            <TableBody>
                {nodeList.map((node, i) => {
                    return (
                        <React.Fragment key={node.id}>
                            <NodeDetail
                                node={node}
                                gitAnalyzer={gitAnalyzer}
                                registerFavoriteFragment={props.registerFavoriteFragment}
                                useHeuristicMerge={props.useHeuristicMerge}
                            />
                            {node.mergeNodes.map((mn, fi) => (
                                <NodeDetail
                                    gitAnalyzer={gitAnalyzer}
                                    parentNode={node}
                                    node={mn}
                                    key={fi}
                                    registerFavoriteFragment={props.registerFavoriteFragment}
                                    useHeuristicMerge={props.useHeuristicMerge}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default NodeDetailList;