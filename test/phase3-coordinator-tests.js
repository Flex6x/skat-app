const test = require('node:test');
const assert = require('node:assert');
const Player = require('../server/game/player');
const BiddingCoordinator = require('../server/game/biddingCoordinator');
const GameRoom = require('../server/game/gameRoom');

test('BiddingCoordinator - Full bidding sequence', async (t) => {
    const players = [
        new Player(0, 'bot', 'Bot1'),
        new Player(1, 'bot', 'Bot2'),
        new Player(2, 'bot', 'Bot3')
    ];

    let result = null;

    const coordinator = new BiddingCoordinator(players, 0, (declarerId, bidValue) => {
        result = { declarerId, bidValue };
    });

    await coordinator.start();

    assert.ok(result !== null, 'Should have a result');
    assert.ok(result.declarerId >= -1 && result.declarerId < 3, `Declarer should be valid, got ${result.declarerId}`);
    assert.ok(result.bidValue >= 0, `Bid should be non-negative, got ${result.bidValue}`);
    console.log(`✓ Bidding complete: Declarer=${result.declarerId}, Bid=${result.bidValue}`);
});

test('GameRoom - Room initialization', (t) => {
    const playerConfigs = [
        { type: 'human', name: 'Alice' },
        { type: 'bot', name: 'Bot1' },
        { type: 'bot', name: 'Bot2' }
    ];

    const room = new GameRoom('room-1', playerConfigs, {}, {});

    assert.strictEqual(room.roomId, 'room-1');
    assert.strictEqual(room.players.length, 3);
    assert.strictEqual(room.gameState, 'initializing');
    console.log('✓ GameRoom initialized correctly');
});

test('GameRoom - Player setup', (t) => {
    const playerConfigs = [
        { type: 'human', name: 'Alice' },
        { type: 'bot', name: 'Bot1' },
        { type: 'bot', name: 'Bot2' }
    ];

    const room = new GameRoom('room-2', playerConfigs);

    assert.strictEqual(room.players[0].name, 'Alice');
    assert.strictEqual(room.players[0].type, 'human');
    assert.strictEqual(room.players[1].type, 'bot');
    console.log('✓ Players configured correctly');
});

test('GameRoom - State broadcast callback', (t) => {
    const playerConfigs = [
        { type: 'bot', name: 'Bot1' },
        { type: 'bot', name: 'Bot2' },
        { type: 'bot', name: 'Bot3' }
    ];

    let broadcastCount = 0;
    const callbacks = {
        onStateUpdate: (data) => {
            broadcastCount++;
        }
    };

    const room = new GameRoom('room-3', playerConfigs, {}, callbacks);

    // Simulate a broadcast
    room._broadcastStateUpdate('TEST_PHASE');
    assert.strictEqual(broadcastCount, 1, 'Should broadcast state updates');
    console.log('✓ State broadcast working');
});
