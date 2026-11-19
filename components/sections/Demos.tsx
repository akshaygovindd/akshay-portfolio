import Pipeline from "./Pipeline";
import Playground from "./Playground";

/** Interactive demos: the companion switches to its "point" pose here. */
export default function Demos() {
  return (
    <div id="demos">
      <Pipeline />
      <Playground />
    </div>
  );
}
