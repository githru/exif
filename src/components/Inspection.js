import React from 'react';
import Detail from "./Detail";
import { useSelector } from "react-redux";

const Inspection = (props) => {
    const { capturedSummaryInfoList, currentCapturedSummaryInfoId } = useSelector(state => state);
    const { inspectionPaneWidth } = useSelector(state => state.layout);

    return (
        <div
          id="inspectionPane"
             style={{
                 width: "1676px"
             }}
        //   style={{
        //     visibility:"hidden",
        //     width:clusterOverviewWidth + "px"
        //   }}
        >
            {capturedSummaryInfoList.map( (d, i) => (
                <Detail
                    capturedSummaryInfoId = {d.id}
                    key={d.id}
                    gitAnalyzer={props.gitAnalyzer}
                    width={inspectionPaneWidth}
                    
                    keywords={[]}
                    searchResultList={[]}

                    seq={d.id}
                    capturedClusterNodes={d.clusterNodes}
                    groupingParameters={d.groupingParameters}

                    interestedItemList={d.interestedItemList}
                    // addInterestsItems={undefined}
                    // removeInterestsItem={undefined}
                    // addFavoriteFragment={undefined}
                    // addFragmentHistory={undefined}
                />
            ))}
        
        </div>
        
    );
}

export default Inspection;