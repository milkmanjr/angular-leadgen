/* jshint node: true */
const React = require('react');
const ReactDOM = require('react-dom');

let ReactTester = React.createClass({
    render() {
        return (
            <div className="container">
                <h4>Welcome To</h4>
                <div className="test">{this.props.name}</div>
                <p> This text is rendered from the `src/renderer.js` React Component</p>
            </div>
        )
    }
});

ReactDOM.render(
    <ReactTester name="Spinifex Foundation"/>,
    document.getElementById('react-root')
);
