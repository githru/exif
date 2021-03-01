import React from 'react';
import v2 from './AppV2';
import Home from './Home';
import { Route, Switch } from 'react-router-dom';


class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <Switch>
                <Route exact path="/exif" component = { v2 }/>
            </Switch>
        );
    }
}

export default App;
