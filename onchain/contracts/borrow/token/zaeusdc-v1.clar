(use-trait ft .ft-mint-trait.ft-mint-trait)
(use-trait sip10 .ft-trait.ft-trait)
(use-trait oracle-trait .oracle-trait.oracle-trait)

(impl-trait .a-token-trait.a-token-trait)
(impl-trait .ownable-trait.ownable-trait)

(define-constant ERR_UNAUTHORIZED (err u14401))
(define-constant ERR_INVALID_TRANSFER (err u14402))
(define-constant ERR_INVALID_AMOUNT (err u14403))
(define-constant ERR_INVALID_ASSET (err u14404))

(define-fungible-token zaeusdc)

(define-data-var token-uri (string-utf8 256) u"https://token-meta.s3.eu-central-1.amazonaws.com/zaeUSDC.json")
(define-data-var token-name (string-ascii 32) "Zest aeUSDC")
(define-data-var token-symbol (string-ascii 32) "zaeUSDC")

(define-constant asset-addr 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc)

(define-read-only (get-total-supply)
  (ok (ft-get-supply zaeusdc)))

(define-read-only (get-name)
  (ok (var-get token-name)))

(define-read-only (get-symbol)
  (ok (var-get token-symbol)))

(define-read-only (get-decimals)
  (ok u6))

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri))))

(define-read-only (get-balance (account principal))
  (let (
    (current-principal-balance (unwrap-panic (get-principal-balance account)))
  )
    (if (is-eq current-principal-balance u0)
      (ok u0)
      (let (
        (cumulated-balance
          (contract-call? .pool-0-reserve calculate-cumulated-balance
            account
            u6
            asset-addr
            current-principal-balance
            u6)))
        cumulated-balance
      )
    )
  )
)

(define-read-only (get-principal-balance (account principal))
  (ok 
    (+
      (unwrap-panic (contract-call? .zaeusdc get-principal-balance account))
      (ft-get-balance zaeusdc account)
    )
  )
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set token-uri value))))

(define-public (set-token-name (value (string-ascii 32)))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok   (var-set token-name value))))

(define-public (set-token-symbol (value (string-ascii 32)))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set token-symbol value))))

(define-private (transfer-internal (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (match (ft-transfer? zaeusdc amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  ERR_UNAUTHORIZED
)

(define-public (transfer-on-liquidation (amount uint) (from principal) (to principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (try! (execute-transfer-internal amount from to))
    (ok amount)
  )
)

(define-private (burn-internal (amount uint) (owner principal))
  (ft-burn? zaeusdc amount owner)
)

(define-private (mint-internal (amount uint) (owner principal))
  (ft-mint? zaeusdc amount owner)
)

(define-public (burn-on-liquidation (amount uint) (owner principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (let ((ret (try! (cumulate-balance-internal owner))))
      (try! (burn-internal amount owner))
      (if (is-eq (- (get current-balance ret) amount) u0)
        (begin
          (try! (contract-call? .pool-0-reserve set-user-reserve-as-collateral owner asset-addr false))
          (try! (contract-call? .pool-0-reserve remove-supplied-asset-ztoken owner asset-addr))
          (try! (contract-call? .pool-0-reserve reset-user-index owner asset-addr))
        )
        false
      )
      (ok amount)
    )
  )
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (let (
      (ret (try! (cumulate-balance-internal recipient)))
    )
      (mint-internal amount recipient)
    )
  )
)

(define-public (burn (amount uint) (owner principal))
  (begin
    (try! (is-approved-contract contract-caller))
    (burn-internal amount owner)
  )
)

(define-private (cumulate-balance-internal (account principal))
  (let (
    (v0-balance (unwrap-panic (contract-call? .zaeusdc get-principal-balance account)))
    (previous-balance (unwrap-panic (get-principal-balance account)))
    (balance-increase (- (unwrap-panic (get-balance account)) previous-balance))
    (reserve-state (try! (contract-call? .pool-0-reserve get-reserve-state asset-addr)))
    (new-user-index (contract-call? .pool-0-reserve get-normalized-income
        (get current-liquidity-rate reserve-state)
        (get last-updated-block reserve-state)
        (get last-liquidity-cumulative-index reserve-state))))
    (try! (contract-call? .pool-0-reserve set-user-index account asset-addr new-user-index))

    ;; transfer previous balance and mint to new token
    (if (> v0-balance u0)
      (begin
        (try! (mint-internal v0-balance account))
        (try! (contract-call? .zaeusdc burn v0-balance account))
        true
      )
      false
    )

    (if (is-eq balance-increase u0)
      false
      (try! (mint-internal balance-increase account)))
    (ok {
      previous-user-balance: previous-balance,
      current-balance: (+ previous-balance balance-increase),
      balance-increase: balance-increase,
      index: new-user-index,
    })
  )
)

(define-constant max-value (contract-call? .math get-max-value))

(define-public (withdraw
  (pool-reserve principal)
  (asset <sip10>)
  (oracle <oracle-trait>)
  (amount uint)
  (owner principal)
  (assets (list 100 { asset: <sip10>, lp-token: <ft>, oracle: <oracle-trait> }))
  )
  (let (
    (ret (try! (cumulate-balance-internal owner)))
    (amount-to-redeem (if (is-eq amount max-value) (get current-balance ret) amount))
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (and (> amount u0) (>= (get current-balance ret) amount-to-redeem)) ERR_INVALID_AMOUNT)
    (asserts! (try! (is-transfer-allowed asset-addr oracle amount-to-redeem owner assets)) ERR_INVALID_TRANSFER)
    (asserts! (is-eq (contract-of asset) asset-addr) ERR_UNAUTHORIZED)
    
    (try! (burn-internal amount-to-redeem owner))

    (if (is-eq (- (get current-balance ret) amount-to-redeem) u0)
      (begin
        (try! (contract-call? .pool-0-reserve set-user-reserve-as-collateral owner asset-addr false))
        (try! (contract-call? .pool-0-reserve remove-supplied-asset-ztoken owner asset-addr))
        (try! (contract-call? .pool-0-reserve reset-user-index owner asset-addr))
      )
      false
    )

    (contract-call? .pool-borrow-v1-1 withdraw
      pool-reserve
      asset-addr
      oracle
      assets
      amount-to-redeem
      (get current-balance ret)
      owner
    )
  )
)

(define-private (execute-transfer-internal
  (amount uint)
  (sender principal)
  (recipient principal)
  )
  (let (
    (from-ret (try! (cumulate-balance-internal sender)))
    (to-ret (try! (cumulate-balance-internal recipient)))
  )
    (try! (transfer-internal amount sender recipient none))
    (try! (contract-call? .pool-0-reserve add-supplied-asset-ztoken recipient asset-addr))
    (if (is-eq (- (get current-balance from-ret) amount) u0)
      (begin
        (try! (contract-call? .pool-0-reserve set-user-reserve-as-collateral sender asset-addr false))
        (try! (contract-call? .pool-0-reserve remove-supplied-asset-ztoken sender asset-addr))
        (contract-call? .pool-0-reserve reset-user-index sender asset-addr)
      )
      (ok true)
    )
  )
)

(define-public (is-transfer-allowed
  (asset <sip10>)
  (oracle <oracle-trait>)
  (amount uint)
  (user principal)
  (assets-to-calculate (list 100 { asset: <sip10>, lp-token: <ft>, oracle: <oracle-trait> })))
  (contract-call? .pool-0-reserve check-balance-decrease-allowed asset oracle amount user assets-to-calculate)
)

;; -- ownable-trait --
(define-data-var contract-owner principal tx-sender)

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-zaeusdc", payload: owner })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

;; -- permissions
(define-map approved-contracts principal bool)

(define-public (set-approved-contract (contract principal) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (map-set approved-contracts contract enabled))
  )
)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED))