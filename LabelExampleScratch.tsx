let {
	Label,
	Fabric } = window.Fabric;

const LabelBasicExample = () => (
  <div>
    <Label>I'm a Label</Label>
    <Label disabled={true}>I'm a disabled Label</Label>
    <Label required={true}>I'm a required Label</Label>
  </div>
);

ReactDOM.render(<LabelBasicExample/>,document.getElementById("content"));