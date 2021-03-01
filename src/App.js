import React from 'react';
import AppV2 from './AppV2';
import Home from './Home';
import { Route, Switch } from 'react-router-dom';


class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <AppV2/>
        );
    }
}

export default App;
