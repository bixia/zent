(define-constant deployer  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant user  'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant ONE_8 u100000000) ;; 8 decimal places

;; set-price
(contract-call? .oracle set-price .ststx u161000000)
(contract-call? .oracle set-price .wstx u160000000)
(contract-call? .oracle set-price .sbtc u4000000000000)
(contract-call? .oracle set-price .xusd u100000000)
(contract-call? .oracle set-price .usda u99000000)
(contract-call? .oracle set-price .diko u40000000)

(contract-call? .pool-borrow init .lp-ststx .ststx u6 u340282366920938463463374607431768211455 u340282366920938463463374607431768211455 .oracle .interest-rate-strategy-default)
(contract-call? .pool-borrow init .lp-wstx .wstx u6 u340282366920938463463374607431768211455 u340282366920938463463374607431768211455 .oracle .interest-rate-strategy-default)
(contract-call? .pool-borrow init .lp-sbtc .sbtc u6 u340282366920938463463374607431768211455 u340282366920938463463374607431768211455 .oracle .interest-rate-strategy-default)
(contract-call? .pool-borrow init .lp-xusd .xusd u6 u340282366920938463463374607431768211455 u340282366920938463463374607431768211455 .oracle .interest-rate-strategy-default)
(contract-call? .pool-borrow init .lp-diko .diko u6 u340282366920938463463374607431768211455 u340282366920938463463374607431768211455 .oracle .interest-rate-strategy-default)
(contract-call? .pool-borrow init .lp-usda .usda u6 u340282366920938463463374607431768211455 u340282366920938463463374607431768211455 .oracle .interest-rate-strategy-default)
(contract-call? .pool-borrow add-asset .ststx)
(contract-call? .pool-borrow add-asset .wstx)
(contract-call? .pool-borrow add-asset .sbtc)
(contract-call? .pool-borrow add-asset .xusd)
(contract-call? .pool-borrow add-asset .diko)
(contract-call? .pool-borrow add-asset .usda)
(contract-call? .pool-borrow set-borrowing-enabled .sbtc true)
(contract-call? .pool-borrow set-borrowing-enabled .ststx true)
(contract-call? .pool-borrow set-borrowing-enabled .wstx true)
(contract-call? .pool-borrow set-borrowing-enabled .xusd true)
(contract-call? .pool-borrow set-borrowing-enabled .diko true)
(contract-call? .pool-borrow set-borrowing-enabled .usda true)
(contract-call? .oracle set-price .ststx u160000000)
(contract-call? .pool-borrow add-isolated-asset .ststx u100000000000000)
(contract-call? .pool-borrow set-borroweable-isolated .xusd)
(contract-call? .pool-borrow set-borroweable-isolated .usda)
(contract-call? .pool-borrow set-usage-as-collateral-enabled .diko true u80000000 u90000000 u50000000)
(contract-call? .pool-borrow set-usage-as-collateral-enabled .sbtc true u80000000 u90000000 u50000000)
(contract-call? .pool-borrow set-usage-as-collateral-enabled .wstx true u80000000 u90000000 u50000000)
(contract-call? .pool-borrow set-usage-as-collateral-enabled .usda true u80000000 u90000000 u50000000)
(contract-call? .pool-borrow set-usage-as-collateral-enabled .xusd true u80000000 u90000000 u50000000)

(contract-call? .ststx mint u1000000000000000 deployer)
(contract-call? .xusd mint u1000000000000000 deployer)
(contract-call? .diko mint u1000000000000000 deployer)
(contract-call? .sbtc mint u1000000000000000 deployer)
(contract-call? .usda mint u1000000000000000 deployer)

(contract-call? .pool-0-reserve set-lending-pool .pool-borrow-v1-1)
(contract-call? .pool-0-reserve set-approved-contract .pool-borrow-v1-1 true)

(contract-call? .pool-0-reserve set-optimal-utilization-rate .diko u50000000)
(contract-call? .pool-0-reserve set-base-variable-borrow-rate .diko u50000000)
(contract-call? .pool-0-reserve set-variable-rate-slope-1 .diko u50000000)
(contract-call? .lp-diko set-approved-contract .pool-borrow-v1-1 true)

(contract-call? .pool-0-reserve set-optimal-utilization-rate .xusd u50000000)
(contract-call? .pool-0-reserve set-base-variable-borrow-rate .xusd u50000000)
(contract-call? .pool-0-reserve set-variable-rate-slope-1 .xusd u50000000)
(contract-call? .lp-xusd set-approved-contract .pool-borrow-v1-1 true)

(contract-call? .pool-0-reserve set-optimal-utilization-rate .sbtc u50000000)
(contract-call? .pool-0-reserve set-base-variable-borrow-rate .sbtc u50000000)
(contract-call? .pool-0-reserve set-variable-rate-slope-1 .sbtc u50000000)
(contract-call? .lp-sbtc set-approved-contract .pool-borrow-v1-1 true)

(contract-call? .pool-0-reserve set-optimal-utilization-rate .ststx u50000000)
(contract-call? .pool-0-reserve set-base-variable-borrow-rate .ststx u50000000)
(contract-call? .pool-0-reserve set-variable-rate-slope-1 .ststx u50000000)
(contract-call? .lp-ststx set-approved-contract .pool-borrow-v1-1 true)

(contract-call? .pool-0-reserve set-optimal-utilization-rate .usda u50000000)
(contract-call? .pool-0-reserve set-base-variable-borrow-rate .usda u50000000)
(contract-call? .pool-0-reserve set-variable-rate-slope-1 .usda u50000000)
(contract-call? .lp-usda set-approved-contract .pool-borrow-v1-1 true)


(contract-call? .pool-borrow-v1-1 set-approved-contract .borrow-helper true)

(contract-call? .borrow-helper supply .lp-diko .pool-0-reserve .diko u100000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM none)
(contract-call? .borrow-helper supply .lp-xusd .pool-0-reserve .xusd u100000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM none)
(contract-call? .borrow-helper supply .lp-sbtc .pool-0-reserve .sbtc u100000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM none)
(contract-call? .borrow-helper supply .lp-ststx .pool-0-reserve .ststx u100000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM none)
(contract-call? .borrow-helper supply .lp-usda .pool-0-reserve .usda u100000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM none)

(contract-call? .borrow-helper set-user-use-reserve-as-collateral 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM .lp-usda .usda false .oracle 
    (list 
    {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    {asset: .wstx, lp-token: .lp-wstx, oracle: .oracle}
    {asset: .sbtc, lp-token: .lp-sbtc, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    ))

(contract-call? .borrow-helper borrow .pool-0-reserve .oracle .xusd .lp-xusd 
    (list 
    {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    {asset: .wstx, lp-token: .lp-wstx, oracle: .oracle}
    {asset: .sbtc, lp-token: .lp-sbtc, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    )
    u1276800
    .fees-calculator
    u0
    deployer
    )