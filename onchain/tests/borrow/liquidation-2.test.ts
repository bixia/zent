import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToJSON, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";
import { MintableToken } from "./models/token";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;

const Liquidator_1 = accounts.get("wallet_5")!;
const Collector = accounts.get("wallet_15")!;
const Collector_2 = accounts.get("wallet_14")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);

const lpdiko = "lp-diko";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpUSDA = "lp-usda";
const lpxUSD = "lp-xusd";
const lpxUSDv1 = "lp-xusd-v1";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const zStSTX = lpstSTXv1;
const zsBTC = lpsBTCv1;
const zxUSD = lpxUSDv1;
const USDA = "usda";
const xUSD = "xusd";

const lpwstx = "lp-wstx-v1";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Liquidations", () => {
  beforeEach(() => {
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(deployerAddress, diko, 40000000, deployerAddress);
    oracleContract.setPrice(deployerAddress, USDA, 99000000, deployerAddress);
    oracleContract.setPrice(deployerAddress, stSTX, 200_000_000, deployerAddress);
    oracleContract.setPrice(deployerAddress, wstx, 190_000_000, deployerAddress);
    oracleContract.setPrice(deployerAddress, sBTC, 4000000000000, deployerAddress);
    oracleContract.setPrice(deployerAddress, xUSD, 100_000_000, deployerAddress);

    poolBorrow.init(
      deployerAddress,
      lpstSTXv1,
      deployerAddress,
      stSTX,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    poolBorrow.addAsset(
      deployerAddress,
      stSTX,
      deployerAddress
    );

    poolBorrow.init(
      deployerAddress,
      lpsBTCv1,
      deployerAddress,
      sBTC,
      8,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    poolBorrow.addAsset(
      deployerAddress,
      sBTC,
      deployerAddress
    );

    poolBorrow.init(
      deployerAddress,
      lpxUSDv1,
      deployerAddress,
      xUSD,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    poolBorrow.addAsset(
      deployerAddress,
      xUSD,
      deployerAddress
    );

    let callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(0) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(4000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(300000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(80000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(50000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-total", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(35) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-total", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(35) ], deployerAddress);
    
    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-protocol", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(3000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-protocol", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(3000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(25) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(15000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(10000000) ], deployerAddress);

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/upgrade-contract-v1-1.clar`).toString(), null, deployerAddress);
  });
  it("Use wstx: Borrower_1 falls below health factor threshold and gets all their collateral liquidated", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, Borrower_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);

    callResponse = simnet.transferSTX(400_000_000_000, LP_1, deployerAddress);
    // console.log(Cl.prettyPrint(callResponse.result));
    poolBorrow.init(
      deployerAddress,
      lpwstx,
      deployerAddress,
      wstx,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    poolBorrow.addAsset(
      deployerAddress,
      wstx,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      100_000_000_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      wstx,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-user-reserve-data",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX)
    //   ],
    //   Borrower_1
    // );
    // console.log(simnet.getAssetsMap());
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.00000;
    
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, lpwstx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      100_000_000,
      deployerAddress
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfAfter = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );
    expect(Math.ceil(hfBefore / 2)).toBeLessThanOrEqual(hfAfter + 2000);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    const LiquidatorBalance = BigInt("10000000000000000");
    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    let prevVaultBalance = simnet
      .getAssetsMap()
      .get("STX")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;


    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-borrow-balance",
      [Cl.standardPrincipal(Borrower_1), Cl.contractPrincipal(deployerAddress, stSTX)],
      Borrower_1
    );
    // const userDebtBefore1stList = cvToValue(callResponse.result).value["compounded-balance"].value;
    // callResponse = poolBorrow.getReserveState(deployerAddress, stSTX, deployerAddress);
    // console.log(cvToValue(callResponse.result));
    // const debtBeforeLiq = Number(cvToValue(callResponse.result).value["total-borrows-variable"].value);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(callResponse.events);
    const collateralPurchased = BigInt((callResponse.events[11].data.amount));
    const debtPurchased = BigInt((callResponse.events[12].data.amount));
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    // console.log(Cl.prettyPrint(callResponse.events[callResponse.events.length - 1].data.value!));

    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Liquidator_1)).toBe(
      (LiquidatorBalance + collateralPurchased)
    );
    let currVaultBalance = simnet
      .getAssetsMap()
      .get("STX")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
      callResponse = poolBorrow.getReserveState(deployerAddress, wstx, deployerAddress);
    expect(cvToValue(callResponse.result)["value"]["accrued-to-treasury"]["value"]).toBe("1076221");
    expect(
      simnet
        .getAssetsMap()
        .get(".ststx.ststx")
        ?.get(Collector)!
    ).toBe((40002555n));
    
    expect(BigInt(currVaultBalance) - BigInt(prevVaultBalance)).toBe(debtPurchased);
    // console.log(debtPurchased);

    callResponse = poolBorrow.getReserveState(deployerAddress, wstx, deployerAddress);
    // console.log(cvToValue(callResponse.result));
    expect(Math.ceil(168431814737)).toBe(Number(cvToValue(callResponse.result).value["total-borrows-variable"].value));

    // console.log("Max Borrow amount: ", maxBorrowAmount);
    let prevLiquidatorCollateralBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get(Liquidator_1)!;
    prevVaultBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;

    callResponse = poolBorrow.getUserReserveData(Borrower_1, deployerAddress, stSTX, Borrower_1);
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(true);

    simnet.callPublicFn("pool-reserve-data", "set-protocol-treasury-addr", [ Cl.standardPrincipal(Collector_2) ], deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));
    currVaultBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    let currLiquidatorCollateralBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get(Liquidator_1)!;
    expect(
      simnet
        .getAssetsMap()
        .get(".ststx.ststx")
        ?.get(Collector_2)!
    ).toBe((7997316n));

    // console.log("Liquidator sBTC balance")
    // console.log(currLiquidatorCollateralBalance - prevLiquidatorCollateralBalance)
    // console.log("Vault sBTC balance")
    // console.log(prevVaultBalance - currVaultBalance)

    // add the protocol fee difference
    expect((currLiquidatorCollateralBalance - prevLiquidatorCollateralBalance))
      .toBe(63970532287n);
      // .toBe(prevVaultBalance - currVaultBalance);
    expect(
      simnet
        .getAssetsMap()
        .get(".ststx.ststx")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!
    ).toBe(0n);

    // check user no longer has sBTC as a borrowed asset
    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, wstx),
    ]);

    expect(
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")!?.get(Borrower_1)!
    ).toBe(0n);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, sBTC)
      ],
      Borrower_1
    );
    // expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Liquidator_1)!).toBe(((10000n - 25n) * (2_000_000_000n)) / 10000n + 1n);
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Liquidator_1)!).toBe(10000399952000129n);

    // console.log(cvToValue(callResponse.result).value);
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(false);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Liquidator_1),
        Cl.contractPrincipal(deployerAddress, stSTX)
      ],
      Liquidator_1
    );
    expect((cvToValue(callResponse.result)["use-as-collateral"].value)).toBe(false);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, wstx)
      ],
      Borrower_1
    );
    expect(Number(cvToValue(callResponse.result)["principal-borrow-balance"].value)).toBeGreaterThan(0);
    callResponse = poolBorrow.getUserReserveData(Borrower_1, deployerAddress, sBTC, Borrower_1);
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(false);
  });
  it("Borrower_1 falls below health factor threshold and gets all their collateral liquidated", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.00000;
    
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfAfter = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );
    expect(Math.ceil(hfBefore / 2)).toBeLessThanOrEqual(hfAfter + 100);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    let prevVaultBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;


    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-borrow-balance",
      [Cl.standardPrincipal(Borrower_1), Cl.contractPrincipal(deployerAddress, stSTX)],
      Borrower_1
    );
    // const userDebtBefore1stList = cvToValue(callResponse.result).value["compounded-balance"].value;
    // callResponse = poolBorrow.getReserveState(deployerAddress, stSTX, deployerAddress);
    // console.log(cvToValue(callResponse.result));
    // const debtBeforeLiq = Number(cvToValue(callResponse.result).value["total-borrows-variable"].value);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));1680006384
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));4200015
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));1675806369
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    const debtPurchased = BigInt((callResponse.events[12].data.amount));
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    // console.log(Cl.prettyPrint(callResponse.events[callResponse.events.length - 1].data.value!));

    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Liquidator_1)).toBe(
      (
        1679806384n
        // - (1679586379n * 25n / 10000n)
      )
    );
    let currVaultBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    callResponse = poolBorrow.getReserveState(deployerAddress, stSTX, deployerAddress);
    expect(cvToValue(callResponse.result)["value"]["accrued-to-treasury"]["value"]).toBe("91200");
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get(Collector)!
    ).toBe((200000n));
    
    expect(BigInt(currVaultBalance) - BigInt(prevVaultBalance)).toBe(debtPurchased);
    // console.log(debtPurchased);

    callResponse = poolBorrow.getReserveState(deployerAddress, stSTX, deployerAddress);
    // console.log(cvToValue(callResponse.result));
    expect(Math.ceil(320001216000 / 2)).toBe(Number(cvToValue(callResponse.result).value["total-borrows-variable"].value));

    // console.log("Max Borrow amount: ", maxBorrowAmount);
    let prevLiquidatorCollateralBalance = simnet
      .getAssetsMap()
      .get(".sbtc.sbtc")
      ?.get(Liquidator_1)!;
    prevVaultBalance = simnet
      .getAssetsMap()
      .get(".sbtc.sbtc")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;

    callResponse = poolBorrow.getUserReserveData(Borrower_1, deployerAddress, sBTC, Borrower_1);
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(true);

    simnet.callPublicFn("pool-reserve-data", "set-protocol-treasury-addr", [ Cl.standardPrincipal(Collector_2) ], deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    currVaultBalance = simnet
      .getAssetsMap()
      .get(".sbtc.sbtc")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    let currLiquidatorCollateralBalance = simnet
      .getAssetsMap()
      .get(".sbtc.sbtc")
      ?.get(Liquidator_1)!;
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get(Collector_2)!
    ).toBe((39999n));

      // console.log("Liquidator sBTC balance")
      // console.log(currLiquidatorCollateralBalance - prevLiquidatorCollateralBalance)
      // console.log("Vault sBTC balance")
      // console.log(prevVaultBalance - currVaultBalance)

    // add the protocol fee difference
    expect((currLiquidatorCollateralBalance - prevLiquidatorCollateralBalance))
      .toBe(319953617n);
      // .toBe(prevVaultBalance - currVaultBalance);
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!
    ).toBe(0n);

    // check user no longer has sBTC as a borrowed asset
    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    expect(
      simnet.getAssetsMap().get(".lp-sbtc-v1.lp-sbtc")!?.get(Borrower_1)!
    ).toBe(0n);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, sBTC)
      ],
      Borrower_1
    );
    // expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Liquidator_1)!).toBe(((10000n - 25n) * (2_000_000_000n)) / 10000n + 1n);
    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Liquidator_1)!).toBe(1999760001n);

    // console.log(cvToValue(callResponse.result).value);
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(false);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Liquidator_1),
        Cl.contractPrincipal(deployerAddress, sBTC)
      ],
      Liquidator_1
    );
    expect((cvToValue(callResponse.result)["use-as-collateral"].value)).toBe(false);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, stSTX)
      ],
      Borrower_1
    );
    expect(Number(cvToValue(callResponse.result)["principal-borrow-balance"].value)).toBeGreaterThan(0);
    callResponse = poolBorrow.getUserReserveData(Borrower_1, deployerAddress, sBTC, Borrower_1);
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(false);
  });
  it("Borrower_1 falls below health factor threshold and gets collateral liquidated, verify protocol fee goes to collection address", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.00000;
    
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    const sBtcPrice = 20_000;
    const stSTXPrice = 2;
    const closeFactor = 0.50
    const protocolFeeBps = 25;
    const liquidationBonusFactor = 1.05
    const borrowInterest = 1459200;
    const supplyInterest = 520;
    const accruedBorrowedAmount = maxBorrowAmount + borrowInterest;
    const collateralWithoutBonus  = (Math.ceil(100 * ((accruedBorrowedAmount * closeFactor) * stSTXPrice / sBtcPrice)) )
    const maxCollateralToLiquidate = (Math.ceil(liquidationBonusFactor * 100 * ((accruedBorrowedAmount * closeFactor) * stSTXPrice / sBtcPrice)) )
    const liquidationBonus = maxCollateralToLiquidate - collateralWithoutBonus
    const protocolFee = BigInt(Math.floor(liquidationBonus * protocolFeeBps / 10000))

    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Collector)!).toBe(protocolFee);
  });
  it("Borrower_1 falls below health factor threshold and gets collateral liquidated, verify protocol does not get the fee protocol when it is set to 0", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.00000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(0)
      ],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    const sBtcPrice = 20_000;
    const stSTXPrice = 2;
    const closeFactor = 0.50
    const protocolFeeBps = 0;
    const liquidationBonusFactor = 1.05
    const borrowInterest = 972800;
    const supplyInterest = 520;
    const accruedBorrowedAmount = maxBorrowAmount + borrowInterest;
    const collateralWithoutBonus = BigInt(Math.ceil(100 * ((accruedBorrowedAmount * closeFactor) * stSTXPrice / sBtcPrice)) )
    const maxCollateralToLiquidate = BigInt(Math.floor(liquidationBonusFactor * 100 * ((accruedBorrowedAmount * closeFactor) * stSTXPrice / sBtcPrice)) )
    const liquidationBonus = maxCollateralToLiquidate - collateralWithoutBonus
    const protocolFee = BigInt(liquidationBonus / 10000n)

    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.protocol-treasury")!).toBe(undefined);
    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Liquidator_1)!).toBe(maxCollateralToLiquidate);
  });

  it(`Borrower_1 falls below health factor threshold and gets all their collateral liquidated. Liquidator claims ztokens. Can redeem underlying assets from ztokens in the pool vault.`, () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, deployerAddress, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );
    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    const suppliedSbtcByDeployer = 2_000_000_000n;
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(suppliedSbtcByDeployer),
        Cl.standardPrincipal(deployerAddress),
        Cl.none(),
      ],
      deployerAddress
    );

    let suppliedSbtcByBorrower = 2_000_000_000;
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(suppliedSbtcByBorrower),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // callResponse = simnet.callPublicFn(
    //   "pool-read",
    //   "borrowing-power-in-asset",
    //   [
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //     Cl.standardPrincipal(LP_1),
    //     Cl.list([
    //       Cl.tuple({
    //         asset: Cl.contractPrincipal(deployerAddress, stSTX),
    //         "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
    //         oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
    //       }),
    //       Cl.tuple({
    //         asset: Cl.contractPrincipal(deployerAddress, sBTC),
    //         "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
    //         oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
    //       }),
    //       Cl.tuple({
    //         asset: Cl.contractPrincipal(deployerAddress, xUSD),
    //         "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
    //         oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
    //       }),
    //     ]),
    //   ],
    //   Borrower_1
    // );
    const borrowedStSTX = 1000000000n;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(borrowedStSTX),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(LP_1),
      ],
      LP_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);


    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfAfter = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );
    expect(Math.ceil(hfBefore / 2)).toBeLessThanOrEqual(hfAfter + 100);
    
    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log("sBTC");
    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log("lp-sbtc-v1");
    // console.log(simnet.getAssetsMap().get(".lp-sbtc-v1.lp-sBTC"));
    const sbtcBeforeLiquidationInVault  = simnet.getAssetsMap().get(".sbtc.sbtc")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    // console.log(simnet.getAssetsMap().get(".lp-sbtc-v1.lp-sbtc"));

    // suppliedSbtcByBorrower = cvToValue(simnet.callReadOnlyFn(
    //   "pool-read-supply",
    //   "get-supplied-balance-user-sbtc",
    //   [
    //     Cl.standardPrincipal(Borrower_1)
    //   ],
    //   Borrower_1
    // ).result);

    // console.log("supplied sbtc by Borrower");
    // console.log(suppliedSbtcByBorrower);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(true),
      ],
      Liquidator_1
    );
    const sbtcAfterLiquidationInVault = simnet.getAssetsMap().get(".sbtc.sbtc")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    const lpsbtcSentToLiquidator  = simnet.getAssetsMap().get(".lp-sbtc-v1.lp-sbtc")?.get(Liquidator_1)!;
    const sBtcPrice = 20_000;
    const stSTXPrice = 2;
    const closeFactor = 0.50
    const protocolFeeBps = 25;
    const liquidationBonusFactor = 1.05
    const borrowInterest = 1459200;
    const supplyInterest = 520;
    const accruedBorrowedAmount = maxBorrowAmount + borrowInterest;
    suppliedSbtcByBorrower += supplyInterest;
    const collateralWithoutBonus  = (Math.ceil(100 * ((accruedBorrowedAmount * closeFactor) * stSTXPrice / sBtcPrice)) )
    const maxCollateralToLiquidate = (Math.ceil(liquidationBonusFactor * 100 * ((accruedBorrowedAmount * closeFactor) * stSTXPrice / sBtcPrice)) )
    const liquidationBonus = maxCollateralToLiquidate - collateralWithoutBonus
    const protocolFee = Math.floor(liquidationBonus * protocolFeeBps / 10000)

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Liquidator_1)],
      Liquidator_1
    );
    expect(
      simnet.getAssetsMap().get(".lp-sbtc-v1.lp-sbtc")?.get(Liquidator_1)
    ).toBe(BigInt(maxCollateralToLiquidate - protocolFee));
    expect(
      simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Collector)
    ).toBe(BigInt(protocolFee));

    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, sBTC),
    ]);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, sBTC),
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(true),
      ],
      Liquidator_1
    );

    // console.log("after 2nd liq")
    // console.log(simnet.getAssetsMap().get(".lp-sbtc-v1.lp-sbtc"));
    // console.log("hhh")
    // console.log(simnet.getAssetsMap().get(".sbtc.sbtc"));

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Liquidator_1),
        Cl.contractPrincipal(deployerAddress, sBTC)
      ],
      Liquidator_1
    );
    expect((cvToValue(callResponse.result)["use-as-collateral"].value)).toBe(false);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Liquidator_1),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    callResponse = poolBorrow.getUserReserveData(Liquidator_1, deployerAddress, sBTC, Liquidator_1);
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(true);
    // console.log(cvToValue(callResponse.result));

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.lp-sbtc-v1`,
      "get-balance",
      [Cl.standardPrincipal(Liquidator_1)],
      Liquidator_1
    );
    const boughtLpSbtc = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(true),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90001));

    const interest = 639n;

    expect(
      simnet.getAssetsMap().get(".lp-sbtc-v1.lp-sbtc")?.get(Liquidator_1)
    ).toBe(
      1999760641n
    );
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "get-user-underlying-asset-balance",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(Liquidator_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });
  it(`Borrower_1 falls below health factor threshold and gets all their collateral liquidated. There are assets still available in the reserves, the reserve assets remain untouched.`, () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = sBTCToken.mint(
      400_000_000_000,
      deployerAddress,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(deployerAddress),
        Cl.none(),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    
    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    let prevVaultBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    // console.log(callResponse.events);
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!
    ).toBe(400000000000n);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);
  });

  it(`Borrower_1 falls below health factor threshold and gets all their collateral liquidated. There is not enough collateral remaining in the reserve for liquidity because someone borrowed the assets.`, () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = sBTCToken.mint(
      400_000_000_000,
      deployerAddress,
      deployerAddress
    );
    callResponse = xUSDToken.mint(
      400_000_000_000_000,
      deployerAddress,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result))

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    // callResponse = poolBorrow.supply(
    //   deployerAddress,
    //   lpstSTXv1,
    //   deployerAddress,
    //   pool0Reserve,
    //   deployerAddress,
    //   stSTX,
    //   400_000_000_000,
    //   LP_1,
    //   LP_1
    // );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(400_000_000_000_000),
        Cl.standardPrincipal(deployerAddress),
        Cl.none(),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;
    // Borrower borrows
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.standardPrincipal(deployerAddress),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      deployerAddress
    );
    // console.log("Borrow power");
    maxBorrowAmount = Math.floor(
      Number(cvToValue(callResponse.result)["value"]) * 1.000000
    );
    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(2000000000)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(deployerAddress),
      ],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    let prevVaultBalance = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90005));
  });
  it("Supply multiple assets unused as collateral, price falls. Can withdraw other assets. Collateral can be liquidated, ", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = xUSDToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      60000000,
      70000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result))

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(cvToValue(callResponse.result));
    // console.log((callResponse.events[callResponse.events.length - 1]));
    // console.log(Cl.prettyPrint(callResponse.events[callResponse.events.length - 1].data.value!));
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    // purchasing more than available collateral
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(Cl.prettyPrint(callResponse.events[callResponse.events.length - 1].data.value!));

    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    // try to liquidate more stSTX after all sBTC collateral has been used
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );

    expect(callResponse.result).toBeErr(Cl.uint(90001));

    // try to liquidate xUSD that is unused as collateral
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // console.log(Cl.prettyPrint(callResponse.result))
    expect(callResponse.result).toBeErr(Cl.uint(90003));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(14401));

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.lp-xusd-v1`,
      "get-principal-balance",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    expect(
      simnet.getAssetsMap().get(".lp-xusd-v1.lp-xusd")?.get(Borrower_1)!
    ).toBe(0n);
    expect(simnet.getAssetsMap().get(".xusd.xusd")?.get(Borrower_1)!).toBe(
      2_000_000_000n
    );
  });
  it("Supply multiple assets unused as collateral, price falls. Can enable use as collateral and cannot be liquidated", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = xUSDToken.mint(400_000_000_000, Borrower_1, deployerAddress);
    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    // get value of sBTC collateral
    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const sBTCCollateralValueBeforePriceReduction = cvToJSON(callResponse.result)["value"][
      "value"
    ]["total-collateral-balanceUSD"]["value"];

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    // get value of collateral after providing xusd
    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const valueOfallCollateralIfEnabled = cvToJSON(callResponse.result)["value"][
      "value"
    ]["total-collateral-balanceUSD"]["value"];

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmount)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log("User data before price fall");
    let collateralValueBeforePriceFall = cvToJSON(callResponse.result)["value"][
      "value"
    ]["total-collateral-balanceUSD"]["value"];

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log("User data after price fall");
    expect(
      cvToJSON(callResponse.result)["value"]["value"][
        "is-health-factor-below-treshold"
      ]["value"]
    ).toBeTruthy();

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log("User data after enabling use as collateral");
    let collateralxUSDEnabled = cvToJSON(callResponse.result)["value"]["value"][
      "total-collateral-balanceUSD"
    ]["value"];

    const lossFromReduction = (collateralValueBeforePriceFall / 2)
    expect(Number(valueOfallCollateralIfEnabled) - Number(lossFromReduction)).toBe(Number(collateralxUSDEnabled));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90000));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90000));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30009));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90001));
    // expect(callResponse.result).toBeOk(Cl.uint(0));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(14402));
  });
  it("Supply an asset and borrow the same asset and another asset. Liquidate by purchasing the debt that is the same as the collateral.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = xUSDToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = xUSDToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );
    
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(100_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(cvToValue(callResponse.result));
    // reduce by arbitrary small amount
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) - 800;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, lpxUSDv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(maxBorrowAmount),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    // console.log(simnet.getAssetsMap().get(".sbtc.sbtc"));
    // purchasing more than available collateral
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[callResponse.events.length - 1].data.value!));
    // console.log(simnet.getAssetsMap().get(".sbtc.sbtc"));
  });
});
