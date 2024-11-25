import { expect } from "chai";
import { HeadingCalculator } from "./compass";

describe("compass", () => {
  it("should calculate heading from a series of points", () => {
    let calculator = new HeadingCalculator(3);
    // Insufficient points
    expect(calculator.computeHeading()).to.equal(null);

    calculator.addPoint(1, 1);
    calculator.addPoint(2, 2);
    calculator.addPoint(3, 3);

    expect(calculator.computeHeading()).to.be.closeTo(45.0, 0.1);
  });
});
