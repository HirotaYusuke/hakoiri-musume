import type { Piece, Puzzle } from '../domain'

const standardPieces: readonly Piece[] = [
  { id: 'musume', name: '娘', width: 2, height: 2, kind: 'goal' },
  { id: 'father', name: '父', width: 1, height: 2, kind: 'vertical' },
  { id: 'mother', name: '母', width: 1, height: 2, kind: 'vertical' },
  { id: 'guard-left', name: '番人左', width: 1, height: 2, kind: 'vertical' },
  { id: 'guard-right', name: '番人右', width: 1, height: 2, kind: 'vertical' },
  { id: 'samurai-left', name: '侍左', width: 1, height: 1, kind: 'small' },
  { id: 'samurai-right', name: '侍右', width: 1, height: 1, kind: 'small' },
  { id: 'child-left', name: '小姓左', width: 1, height: 1, kind: 'small' },
  { id: 'child-right', name: '小姓右', width: 1, height: 1, kind: 'small' },
  { id: 'servant-left', name: '下女左', width: 1, height: 1, kind: 'small' },
  { id: 'servant-right', name: '下女右', width: 1, height: 1, kind: 'small' },
]

export const puzzles: readonly Puzzle[] = [
  {
    id: 'standard-hakoiri-musume',
    title: '標準箱入り娘',
    description: '4x5盤面の中央上に娘を置く、箱入り娘の代表的な初期配置です。',
    board: { width: 4, height: 5 },
    goal: { pieceId: 'musume', x: 1, y: 3 },
    pieces: standardPieces,
    initialPlacements: [
      { pieceId: 'father', x: 0, y: 0 },
      { pieceId: 'musume', x: 1, y: 0 },
      { pieceId: 'mother', x: 3, y: 0 },
      { pieceId: 'guard-left', x: 0, y: 2 },
      { pieceId: 'samurai-left', x: 1, y: 2 },
      { pieceId: 'samurai-right', x: 2, y: 2 },
      { pieceId: 'guard-right', x: 3, y: 2 },
      { pieceId: 'child-left', x: 1, y: 3 },
      { pieceId: 'child-right', x: 2, y: 3 },
      { pieceId: 'servant-left', x: 0, y: 4 },
      { pieceId: 'servant-right', x: 3, y: 4 },
    ],
    sampleSolution: [
      { pieceId: 'child-left', direction: 'left', note: '出口まわりの空きを作る例' },
      { pieceId: 'child-right', direction: 'right' },
    ],
  },
  {
    id: 'first-escape',
    title: 'はじめての脱出',
    description: '娘を下へ動かすだけでクリアできる、操作確認用の短い問題です。',
    board: { width: 4, height: 5 },
    goal: { pieceId: 'musume', x: 1, y: 3 },
    pieces: [
      { id: 'musume', name: '娘', width: 2, height: 2, kind: 'goal' },
      { id: 'block-left', name: '左番', width: 1, height: 2, kind: 'vertical' },
      { id: 'block-right', name: '右番', width: 1, height: 2, kind: 'vertical' },
    ],
    initialPlacements: [
      { pieceId: 'block-left', x: 0, y: 0 },
      { pieceId: 'musume', x: 1, y: 1 },
      { pieceId: 'block-right', x: 3, y: 0 },
    ],
    sampleSolution: [
      { pieceId: 'musume', direction: 'down' },
      { pieceId: 'musume', direction: 'down' },
    ],
  },
  {
    id: 'side-step',
    title: '横歩き稽古',
    description: '小駒をずらしてから娘を出口へ近づける、移動判定確認用の問題です。',
    board: { width: 4, height: 5 },
    goal: { pieceId: 'musume', x: 1, y: 3 },
    pieces: [
      { id: 'musume', name: '娘', width: 2, height: 2, kind: 'goal' },
      { id: 'koma', name: '小駒', width: 1, height: 1, kind: 'small' },
      { id: 'guard', name: '番人', width: 1, height: 2, kind: 'vertical' },
    ],
    initialPlacements: [
      { pieceId: 'guard', x: 0, y: 0 },
      { pieceId: 'musume', x: 1, y: 1 },
      { pieceId: 'koma', x: 1, y: 3 },
    ],
    sampleSolution: [
      { pieceId: 'koma', direction: 'right' },
      { pieceId: 'musume', direction: 'down' },
      { pieceId: 'musume', direction: 'down' },
    ],
  },
]

export const findPuzzle = (puzzleId: string): Puzzle | undefined =>
  puzzles.find((puzzle) => puzzle.id === puzzleId)
