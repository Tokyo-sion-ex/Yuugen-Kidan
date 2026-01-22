import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialStep, TutorialType } from '../../types/tutorial.types';
import Tile from '../game/Tile';
import { Tile as TileType } from '../../types/game.types';
import './TutorialMode.css';

interface TutorialModeProps {
  tutorialType: TutorialType;
  onComplete: () => void;
  onExit: () => void;
}

const TutorialMode: React.FC<TutorialModeProps> = ({
  tutorialType,
  onComplete,
  onExit
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // チュートリアルデータ
  const tutorials: Record<TutorialType, TutorialStep[]> = {
    'basic-rules': [
      {
        id: 1,
        title: '麻雀の基本',
        description: '麻雀は4人で行う卓上ゲームです。牌（パイ）を使って手役を作り、点数を競います。',
        content: [
          '136枚の牌を使って遊びます',
          '萬子（マンズ）、筒子（ピンズ）、索子（ソーズ）、字牌（ジハイ）の4種類があります',
          '親（デーラー）から時計回りに進行します'
        ],
        exampleTiles: [
          { suit: 'man', value: 1, id: 'tut_man_1' },
          { suit: 'pin', value: 5, id: 'tut_pin_5', isRedFive: true },
          { suit: 'sou', value: 9, id: 'tut_sou_9' },
          { suit: 'wind', value: 'east', id: 'tut_wind_east' }
        ],
        challenge: null,
        hint: '牌にはそれぞれ種類と数字があります。字牌には風牌（東南西北）と三元牌（白發中）があります。'
      },
      {
        id: 2,
        title: 'ゲームの流れ',
        description: '麻雀の基本的な進行方法を学びましょう。',
        content: [
          '1. 最初に13枚の牌が配られます（配牌）',
          '2. 順番に牌を1枚引きます（ツモ）',
          '3. 手牌から1枚捨てます（打牌）',
          '4. これを繰り返して手役を作ります',
          '5. 手役が完成したら和了（ホーラ）です'
        ],
        exampleTiles: [],
        challenge: null,
        hint: '自分の番が来たら必ず牌を1枚引いて、1枚捨てます。これを「ツモって打つ」と言います。'
      },
      {
        id: 3,
        title: '手役の基本',
        description: '麻雀で勝つためには「役」を作る必要があります。',
        content: [
          '4つの面子（メンツ）と1つの雀頭（ジャントウ）を作ります',
          '面子には3種類あります：',
          '• 順子（シュンツ）: 同じ種類で連番の3枚（例: 1萬2萬3萬）',
          '• 刻子（コーツ）: 同じ牌3枚（例: 白白白）',
          '• 槓子（カンツ）: 同じ牌4枚',
          '雀頭は同じ牌2枚です'
        ],
        exampleTiles: [
          { suit: 'man', value: 1, id: 'tut_seq_1' },
          { suit: 'man', value: 2, id: 'tut_seq_2' },
          { suit: 'man', value: 3, id: 'tut_seq_3' },
          { suit: 'dragon', value: 'white', id: 'tut_triplet_1' },
          { suit: 'dragon', value: 'white', id: 'tut_triplet_2' },
          { suit: 'dragon', value: 'white', id: 'tut_triplet_3' }
        ],
        challenge: {
          type: 'identify',
          question: '次の中から順子を選んでください',
          options: [
            { tiles: [{ suit: 'man', value: 1 }, { suit: 'man', value: 2 }, { suit: 'man', value: 3 }], isCorrect: true },
            { tiles: [{ suit: 'pin', value: 5 }, { suit: 'pin', value: 5 }, { suit: 'pin', value: 5 }], isCorrect: false },
            { tiles: [{ suit: 'sou', value: 7 }, { suit: 'sou', value: 8 }, { suit: 'sou', value: 9 }], isCorrect: true }
          ]
        },
        hint: '順子は同じ種類で数字が連続する3枚、刻子は全く同じ牌3枚です。'
      }
    ],
    'yaku-intro': [
      {
        id: 1,
        title: '基本的な役',
        description: '初心者でも覚えやすい基本的な役を学びましょう。',
        content: [
          '断幺九（タンヤオ）: 1・9・字牌を使わない手役（1翻）',
          '役牌（ヤクハイ）: 三元牌や場風などの刻子（1翻）',
          '平和（ピンフ）: すべて順子でできた手役（1翻）',
          '立直（リーチ）: テンパイを宣言する（1翻）'
        ],
        exampleTiles: [
          { suit: 'man', value: 2, id: 'tanyao_1' },
          { suit: 'man', value: 3, id: 'tanyao_2' },
          { suit: 'man', value: 4, id: 'tanyao_3' },
          { suit: 'pin', value: 5, id: 'tanyao_4' },
          { suit: 'pin', value: 6, id: 'tanyao_5' },
          { suit: 'pin', value: 7, id: 'tanyao_6' }
        ],
        challenge: {
          type: 'identify',
          question: '次の手牌は断幺九になっていますか？',
          options: [
            { 
              tiles: [
                { suit: 'man', value: 2 }, { suit: 'man', value: 3 }, { suit: 'man', value: 4 },
                { suit: 'pin', value: 5 }, { suit: 'pin', value: 6 }, { suit: 'pin', value: 7 }
              ], 
              isCorrect: true 
            },
            { 
              tiles: [
                { suit: 'man', value: 1 }, { suit: 'man', value: 2 }, { suit: 'man', value: 3 },
                { suit: 'dragon', value: 'white' }, { suit: 'dragon', value: 'white' }, { suit: 'dragon', value: 'white' }
              ], 
              isCorrect: false 
            }
          ]
        },
        hint: '断幺九は1・9・字牌を一切使わない手役です。比較的作りやすい役です。'
      },
      {
        id: 2,
        title: '鳴きと役',
        description: '鳴き（ポン・チー・カン）をした時の役について学びます。',
        content: [
          '鳴くと「門前（メンゼン）」ではなくなります',
          '鳴いても成立する役：',
          '• 断幺九',
          '• 役牌',
          '• 混一色（ホンイーソー）',
          '• 対々和（トイトイホー）',
          '鳴くと消える役：',
          '• 門前清自摸和',
          '• 平和',
          '• 一盃口'
        ],
        exampleTiles: [],
        challenge: {
          type: 'select',
          question: '鳴いても成立する役を選んでください',
          options: [
            { text: '断幺九', isCorrect: true },
            { text: '平和', isCorrect: false },
            { text: '役牌', isCorrect: true },
            { text: '門前清自摸和', isCorrect: false }
          ]
        },
        hint: '鳴くと便利ですが、門前の役が作れなくなります。バランスが重要です。'
      }
    ],
    'advanced-strategy': [
      {
        id: 1,
        title: '効率的な打牌',
        description: '勝率を上げるための効率的な牌の捨て方を学びます。',
        content: [
          '孤立牌（周りに繋がる牌がない牌）から捨てる',
          '安全牌（他の人が和了りにくい牌）を意識する',
          '手役の方向性を早く決める',
          '中張牌（2-8）は繋がりやすいので残す'
        ],
        exampleTiles: [
          { suit: 'wind', value: 'north', id: 'isolated_1' },
          { suit: 'man', value: 1, id: 'isolated_2' },
          { suit: 'man', value: 9, id: 'isolated_3' },
          { suit: 'man', value: 5, id: 'center_1' },
          { suit: 'pin', value: 5, id: 'center_2', isRedFive: true }
        ],
        challenge: {
          type: 'arrange',
          question: '効率的な打牌順に並び替えてください',
          tiles: [
            { suit: 'wind', value: 'west', id: 'arrange_1' },
            { suit: 'man', value: 9, id: 'arrange_2' },
            { suit: 'man', value: 5, id: 'arrange_3' },
            { suit: 'pin', value: 2, id: 'arrange_4' }
          ],
          correctOrder: [0, 1, 3, 2] // 風牌 → 端牌 → 中張牌の順
        },
        hint: '孤立している牌や役に繋がりにくい牌から捨てるのが基本です。'
      },
      {
        id: 2,
        title: 'リーチの判断',
        description: 'リーチをかけるべきタイミングを学びます。',
        content: [
          'リーチのメリット：',
          '• 1翻追加される',
          '• 裏ドラのチャンス',
          '• 相手にプレッシャー',
          'リーチのデメリット：',
          '• 1000点の供託',
          '• 手牌の変更不可',
          '• 和了り牌が限定される',
          'リーチの目安：',
          '• テンパイしている',
          '• 手牌に価値がある',
          '• 余分な点棒がある'
        ],
        exampleTiles: [],
        challenge: {
          type: 'decide',
          question: '次の状況でリーチすべきですか？',
          scenario: {
            hand: '断幺九のテンパイ、残り点数: 20000点',
            round: '東2局',
            isDealer: false
          },
          options: [
            { text: 'リーチする', isCorrect: true },
            { text: 'リーチしない', isCorrect: false }
          ]
        },
        hint: 'リーチは戦略的な選択です。状況をよく考えて判断しましょう。'
      }
    ]
  };

  const currentTutorial = tutorials[tutorialType];
  const currentStepData = currentTutorial[currentStep];

  // ステップ完了
  const completeStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setScore(prev => prev + 100);
    
    if (currentStep < currentTutorial.length - 1) {
      setCurrentStep(prev => prev + 1);
      setShowHint(false);
    } else {
      onComplete();
    }
  };

  // ヒント表示
  const toggleHint = () => {
    setShowHint(!showHint);
  };

  // チャレンジ回答
  const handleChallengeAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 200);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        completeStep();
      }, 1000);
    } else {
      setShowHint(true);
    }
  };

  // ステップ移動
  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setShowHint(false);
  };

  return (
    <div className="tutorial-mode">
      {/* ヘッダー */}
      <div className="tutorial-header">
        <div className="tutorial-progress">
          <div className="progress-steps">
            {currentTutorial.map((step, index) => (
              <button
                key={step.id}
                className={`step-indicator ${index === currentStep ? 'active' : ''} ${completedSteps.has(index) ? 'completed' : ''}`}
                onClick={() => goToStep(index)}
                title={step.title}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: `${(currentStep / currentTutorial.length) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / currentTutorial.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        <div className="tutorial-score">
          <div className="score-label">スコア</div>
          <div className="score-value">{score}</div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="tutorial-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="tutorial-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* ステップタイトル */}
            <div className="step-header">
              <h2 className="step-title">{currentStepData.title}</h2>
              <div className="step-number">
                ステップ {currentStep + 1}/{currentTutorial.length}
              </div>
            </div>

            {/* 説明 */}
            <div className="step-description">
              <p>{currentStepData.description}</p>
              
              {currentStepData.content.length > 0 && (
                <ul className="step-content">
                  {currentStepData.content.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* 例となる牌 */}
            {currentStepData.exampleTiles.length > 0 && (
              <div className="step-example">
                <h3 className="example-title">例</h3>
                <div className="example-tiles">
                  {currentStepData.exampleTiles.map((tile, index) => (
                    <motion.div
                      key={tile.id}
                      className="example-tile-wrapper"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Tile tile={tile as TileType} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* チャレンジ */}
            {currentStepData.challenge && (
              <div className="step-challenge">
                <h3 className="challenge-title">チャレンジ</h3>
                <p className="challenge-question">
                  {currentStepData.challenge.question}
                </p>

                <div className="challenge-content">
                  {currentStepData.challenge.type === 'identify' && (
                    <div className="challenge-options">
                      {currentStepData.challenge.options.map((option, index) => (
                        <button
                          key={index}
                          className={`challenge-option ${isAnimating && option.isCorrect ? 'correct' : ''}`}
                          onClick={() => handleChallengeAnswer(option.isCorrect)}
                          disabled={isAnimating}
                        >
                          <div className="option-tiles">
                            {option.tiles.map((tile, tileIndex) => (
                              <div key={tileIndex} className="option-tile">
                                <Tile tile={tile as TileType} />
                              </div>
                            ))}
                          </div>
                          {option.isCorrect && isAnimating && (
                            <motion.div
                              className="correct-badge"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring' }}
                            >
                              ✓
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentStepData.challenge.type === 'select' && (
                    <div className="challenge-options-text">
                      {currentStepData.challenge.options.map((option, index) => (
                        <button
                          key={index}
                          className={`challenge-option-text ${isAnimating && option.isCorrect ? 'correct' : ''}`}
                          onClick={() => handleChallengeAnswer(option.isCorrect)}
                          disabled={isAnimating}
                        >
                          {option.text}
                          {option.isCorrect && isAnimating && (
                            <span className="correct-icon">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentStepData.challenge.type === 'arrange' && (
                    <div className="challenge-arrange">
                      <p>牌をクリックして順番に選択してください</p>
                      <div className="arrange-tiles">
                        {/* 並び替えインターフェース */}
                      </div>
                    </div>
                  )}

                  {currentStepData.challenge.type === 'decide' && (
                    <div className="challenge-decide">
                      <div className="scenario">
                        <p><strong>状況:</strong> {currentStepData.challenge.scenario.hand}</p>
                        <p><strong>局:</strong> {currentStepData.challenge.scenario.round}</p>
                        <p><strong>親:</strong> {currentStepData.challenge.scenario.isDealer ? 'はい' : 'いいえ'}</p>
                      </div>
                      <div className="decide-options">
                        {currentStepData.challenge.options.map((option, index) => (
                          <button
                            key={index}
                            className="decide-option"
                            onClick={() => handleChallengeAnswer(option.isCorrect)}
                          >
                            {option.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ヒント */}
            <AnimatePresence>
              {showHint && currentStepData.hint && (
                <motion.div
                  className="step-hint"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="hint-header">
                    <span className="hint-icon">💡</span>
                    <span className="hint-title">ヒント</span>
                  </div>
                  <p className="hint-text">{currentStepData.hint}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* アクションボタン */}
            <div className="step-actions">
              {!currentStepData.challenge && (
                <button
                  className="next-button"
                  onClick={completeStep}
                >
                  {currentStep < currentTutorial.length - 1 ? '次へ進む' : 'チュートリアル完了'}
                </button>
              )}
              
              {currentStepData.hint && !showHint && (
                <button
                  className="hint-button"
                  onClick={toggleHint}
                >
                  ヒントを見る
                </button>
              )}
              
              <button
                className="skip-button"
                onClick={completeStep}
              >
                スキップ
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* フッター */}
      <div className="tutorial-footer">
        <div className="footer-info">
          <div className="info-item">
            <span className="info-label">チュートリアル:</span>
            <span className="info-value">
              {tutorialType === 'basic-rules' ? '基本ルール' :
               tutorialType === 'yaku-intro' ? '役の基本' :
               '上級戦略'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">進捗:</span>
            <span className="info-value">
              {currentStep + 1}/{currentTutorial.length}
            </span>
          </div>
        </div>
        
        <div className="footer-actions">
          <button
            className="exit-button"
            onClick={onExit}
          >
            チュートリアルを終了
          </button>
        </div>
      </div>

      {/* 成功アニメーション */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="success-animation"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
          >
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <div className="success-text">正解！ +200点</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TutorialMode;
