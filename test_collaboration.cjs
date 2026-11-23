const { Client } = require('./frontend/node_modules/@stomp/stompjs');

async function run() {
  const log = (msg) => console.log(`[TEST] ${msg}`);
  const results = {};

  // 1. Setup two users and a room via HTTP API
  log('1. Setting up users and rooms via REST API...');
  
  const userARes = await fetch('http://localhost:8080/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'alice_' + Date.now().toString().slice(-4),
      email: 'alice_' + Date.now() + '@codesync.dev',
      password: 'Password@123',
      fullName: 'Alice Developer',
    }),
  });
  const userA = await userARes.json();
  log(`Created User A: ${userA.username} (${userA.id})`);

  const userBRes = await fetch('http://localhost:8080/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'bob_' + Date.now().toString().slice(-4),
      email: 'bob_' + Date.now() + '@codesync.dev',
      password: 'Password@123',
      fullName: 'Bob Collaborator',
    }),
  });
  const userB = await userBRes.json();
  log(`Created User B: ${userB.username} (${userB.id})`);

  // Create public collaborative room
  const roomRes = await fetch('http://localhost:8080/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Collaborative Workspace',
      language: 'JAVASCRIPT',
      isPrivate: false,
      creatorUserId: userA.id,
    }),
  });
  const room = await roomRes.json();
  log(`Created Room: ${room.name} [AccessCode: ${room.accessCode}]`);

  // User B joins room
  await fetch('http://localhost:8080/api/rooms/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userB.id}`,
    },
    body: JSON.stringify({ accessCode: room.accessCode }),
  });
  log(`User B joined room ${room.id}`);

  // Create private room owned by A
  const privateRoomRes = await fetch('http://localhost:8080/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Secret Private Room',
      language: 'PYTHON',
      isPrivate: true,
      creatorUserId: userA.id,
    }),
  });
  const privateRoom = await privateRoomRes.json();
  log(`Created Private Room: ${privateRoom.name} (${privateRoom.id})`);

  // 2. Connect Session A (Alice)
  log('2. Connecting WebSocket Session A (Alice)...');
  const clientA = new Client({
    brokerURL: 'ws://localhost:8080/ws',
    connectHeaders: { userId: userA.id, username: userA.username },
  });

  const aOpsReceived = [];
  const aPresenceReceived = [];

  const aConnectedPromise = new Promise((resolve, reject) => {
    clientA.onConnect = () => {
      log('Session A connected!');
      clientA.subscribe(`/topic/room/${room.id}`, (msg) => {
        aOpsReceived.push(JSON.parse(msg.body));
      });
      clientA.subscribe(`/topic/room/${room.id}/presence`, (msg) => {
        aPresenceReceived.push(JSON.parse(msg.body));
      });
      resolve();
    };
    clientA.onStompError = (f) => reject(new Error(f.headers.message));
    clientA.onWebSocketError = (e) => reject(e);
  });
  clientA.activate();
  await aConnectedPromise;

  // 3. Connect Session B (Bob)
  log('3. Connecting WebSocket Session B (Bob)...');
  const clientB = new Client({
    brokerURL: 'ws://localhost:8080/ws',
    connectHeaders: { userId: userB.id, username: userB.username },
  });

  const bOpsReceived = [];
  const bPresenceReceived = [];

  const bConnectedPromise = new Promise((resolve, reject) => {
    clientB.onConnect = () => {
      log('Session B connected!');
      clientB.subscribe(`/topic/room/${room.id}`, (msg) => {
        bOpsReceived.push(JSON.parse(msg.body));
      });
      clientB.subscribe(`/topic/room/${room.id}/presence`, (msg) => {
        bPresenceReceived.push(JSON.parse(msg.body));
      });
      resolve();
    };
    clientB.onStompError = (f) => reject(new Error(f.headers.message));
    clientB.onWebSocketError = (e) => reject(e);
  });
  clientB.activate();
  await bConnectedPromise;

  // 4. Send JOIN events
  log('4. Joining collaborative room from both sessions...');
  clientA.publish({
    destination: '/app/editor.join',
    body: JSON.stringify({ roomId: room.id, userId: userA.id }),
  });
  clientB.publish({
    destination: '/app/editor.join',
    body: JSON.stringify({ roomId: room.id, userId: userB.id }),
  });

  await new Promise((r) => setTimeout(r, 1000));
  log(`Presence events received by A: ${aPresenceReceived.length}, B: ${bPresenceReceived.length}`);
  results.presenceJoinTest = aPresenceReceived.some((p) => p.username === userB.username);

  // 5. User A types code -> User B receives change
  log('5. User A types: "const a = 10;" -> broadcasting...');
  clientA.publish({
    destination: '/app/editor.operation',
    body: JSON.stringify({
      type: 'OPERATION',
      roomId: room.id,
      userId: userA.id,
      username: userA.username,
      content: 'const a = 10;',
      revision: 0,
    }),
  });

  await new Promise((r) => setTimeout(r, 1000));
  const bOp1 = bOpsReceived.find((op) => op.type === 'OPERATION' && op.content === 'const a = 10;');
  log(`User B received User A's edit: ${Boolean(bOp1)} (Revision: ${bOp1?.revision})`);
  results.userAToUserB = Boolean(bOp1 && bOp1.revision >= 1);

  // 6. User B types code -> User A receives change
  log('6. User B types: "const a = 10;\\nconst b = 20;" -> broadcasting...');
  clientB.publish({
    destination: '/app/editor.operation',
    body: JSON.stringify({
      type: 'OPERATION',
      roomId: room.id,
      userId: userB.id,
      username: userB.username,
      content: 'const a = 10;\nconst b = 20;',
      revision: bOp1?.revision || 1,
    }),
  });

  await new Promise((r) => setTimeout(r, 1000));
  const aOp2 = aOpsReceived.find(
    (op) => op.type === 'OPERATION' && op.content === 'const a = 10;\nconst b = 20;'
  );
  log(`User A received User B's edit: ${Boolean(aOp2)} (Revision: ${aOp2?.revision})`);
  results.userBToUserA = Boolean(aOp2 && aOp2.revision >= 2);

  // 7. Disconnection & Reconnection
  log('7. Disconnecting User B and testing presence leave event...');
  clientB.deactivate();
  await new Promise((r) => setTimeout(r, 1200));
  const leaveEvent = aPresenceReceived.find((p) => p.type === 'LEAVE' && p.username === userB.username);
  log(`User A received LEAVE event for User B: ${Boolean(leaveEvent)}`);
  results.disconnectEventTest = Boolean(leaveEvent);

  // Reconnect User B
  log('Reconnecting User B and syncing latest document...');
  const clientB2 = new Client({
    brokerURL: 'ws://localhost:8080/ws',
    connectHeaders: { userId: userB.id, username: userB.username },
  });

  const syncPromise = new Promise((resolve) => {
    clientB2.onConnect = () => {
      clientB2.subscribe(`/topic/room/${room.id}`, (msg) => {
        const payload = JSON.parse(msg.body);
        if (payload.type === 'SYNC') {
          resolve(payload);
        }
      });
      clientB2.publish({
        destination: '/app/editor.sync',
        body: JSON.stringify({ roomId: room.id }),
      });
    };
  });
  clientB2.activate();
  const syncPayload = await syncPromise;
  log(`User B resynced document: content="${syncPayload.content.replace(/\n/g, '\\n')}" revision=${syncPayload.revision}`);
  results.reconnectAndResyncTest = Boolean(
    syncPayload && syncPayload.content.includes('const b = 20;')
  );

  // 8. Test Private Room Authorization
  log('8. Testing unauthorized access to Private Room by User B...');
  let rejected = false;
  try {
    const errorPromise = new Promise((resolve) => {
      clientB2.onStompError = (f) => {
        resolve(true);
      };
    });
    // User B tries to subscribe to private room that user B is not part of
    clientB2.subscribe(`/topic/room/${privateRoom.id}`, () => {});
    rejected = await Promise.race([
      errorPromise,
      new Promise((r) => setTimeout(() => r(false), 1500)),
    ]);
  } catch (err) {
    rejected = true;
  }
  log(`Unauthorized subscription to private room was blocked: ${rejected}`);
  results.privateRoomUnauthorizedBlocked = rejected;

  // Cleanup
  clientA.deactivate();
  clientB2.deactivate();

  console.log('\n========================================');
  console.log('DUAL-SESSION WEBSOCKET TEST RESULTS:');
  console.log(JSON.stringify(results, null, 2));
  console.log('========================================');
}

run().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
