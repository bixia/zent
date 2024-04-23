(define-constant deployer  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant user  'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant ONE_8 u100000000) ;; 8 decimal places

(print {user: (contract-call? .lp-usda get-balance 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)})
(print {deployer: (contract-call? .lp-usda get-balance 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)})
(print {user-borrow: (contract-call? .xusd get-balance 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)})

(contract-call? .borrow-helper borrow .pool-0-reserve .oracle .xusd .lp-xusd 
    (list 
    {asset: .ststx, lp-token: .lp-ststx, oracle: .oracle}
    {asset: .wstx, lp-token: .lp-wstx, oracle: .oracle}
    {asset: .sbtc, lp-token: .lp-sbtc, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}
    {asset: .diko, lp-token: .lp-diko, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .usda, lp-token: .lp-usda, oracle: .oracle}
    {asset: .xusd, lp-token: .lp-xusd, oracle: .oracle}


    )
    u20000000
    .fees-calculator
    u0
    'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    )