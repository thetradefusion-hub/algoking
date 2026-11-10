export type CryptoAsset = {
  id: string
  symbol: string
  name: string
  /** Binance pair e.g. BTCUSDT */
  binanceSymbol: string
  tradingViewSymbol: string
  color: string
  image: string
}

/** Popular coins shown on dashboard markets list. */
export const CRYPTO_ASSETS: CryptoAsset[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    binanceSymbol: 'BTCUSDT',
    tradingViewSymbol: 'BINANCE:BTCUSDT',
    color: '#F7931A',
    image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    binanceSymbol: 'ETHUSDT',
    tradingViewSymbol: 'BINANCE:ETHUSDT',
    color: '#627EEA',
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    binanceSymbol: 'BNBUSDT',
    tradingViewSymbol: 'BINANCE:BNBUSDT',
    color: '#F3BA2F',
    image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    binanceSymbol: 'SOLUSDT',
    tradingViewSymbol: 'BINANCE:SOLUSDT',
    color: '#14F195',
    image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    binanceSymbol: 'XRPUSDT',
    tradingViewSymbol: 'BINANCE:XRPUSDT',
    color: '#23292F',
    image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    binanceSymbol: 'ADAUSDT',
    tradingViewSymbol: 'BINANCE:ADAUSDT',
    color: '#0033AD',
    image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    binanceSymbol: 'DOGEUSDT',
    tradingViewSymbol: 'BINANCE:DOGEUSDT',
    color: '#C2A633',
    image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  },
  {
    id: 'tron',
    symbol: 'TRX',
    name: 'TRON',
    binanceSymbol: 'TRXUSDT',
    tradingViewSymbol: 'BINANCE:TRXUSDT',
    color: '#FF0013',
    image: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    binanceSymbol: 'AVAXUSDT',
    tradingViewSymbol: 'BINANCE:AVAXUSDT',
    color: '#E84142',
    image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    binanceSymbol: 'LINKUSDT',
    tradingViewSymbol: 'BINANCE:LINKUSDT',
    color: '#2A5ADA',
    image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    binanceSymbol: 'DOTUSDT',
    tradingViewSymbol: 'BINANCE:DOTUSDT',
    color: '#E6007A',
    image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  },
  {
    id: 'polygon-ecosystem-token',
    symbol: 'POL',
    name: 'Polygon',
    binanceSymbol: 'POLUSDT',
    tradingViewSymbol: 'BINANCE:POLUSDT',
    color: '#8247E5',
    image: 'https://assets.coingecko.com/coins/images/32440/small/polygon.png',
  },
]

export const BINANCE_SYMBOLS = CRYPTO_ASSETS.map((c) => c.binanceSymbol)

export function getCryptoById(id?: string) {
  if (!id) return undefined
  const key = id.toLowerCase()
  return CRYPTO_ASSETS.find(
    (c) => c.id === key || c.symbol.toLowerCase() === key || c.binanceSymbol.toLowerCase() === key
  )
}

export function getCryptoBySymbol(symbol?: string) {
  return CRYPTO_ASSETS.find((c) => c.symbol.toLowerCase() === symbol?.toLowerCase())
}

export function getCryptoByBinanceSymbol(pair?: string) {
  return CRYPTO_ASSETS.find((c) => c.binanceSymbol === pair?.toUpperCase())
}
