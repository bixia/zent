(define-constant deployer  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant user  'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
;; (asserts! (is-eq tx-sender user) "not the user")
(contract-call? .usda mint u10000000 user)
(contract-call? .borrow-helper supply .lp-usda .pool-0-reserve .usda u10000000 user none)
(contract-call? .borrow-helper set-user-use-reserve-as-collateral user .lp-usda .usda false .oracle 
    (list 
    {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    {asset: .wstx, lp-token: .lp-wstx, oracle: .oracle}
    {asset: .sbtc, lp-token: .lp-sbtc, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    ))
(print {a:"i am here"})
(contract-call? .borrow-helper borrow .pool-0-reserve .oracle .xusd .lp-xusd 
    (list 
    {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    {asset: .wstx, lp-token: .lp-wstx, oracle: .oracle}
    {asset: .sbtc, lp-token: .lp-sbtc, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    ;; {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    )
    u1
    .fees-calculator
    u0
    'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    )