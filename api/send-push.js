const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

module.exports = async (req, res) => {
  try {
    if (!getApps().length) {
      const raw = process.env.FIREBASE_SA_BASE64 || '';
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decoded);
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const { toUserId, title, body } = req.method === 'GET' ? req.query : (req.body || {});

    if (!toUserId) {
      res.status(400).json({ error: 'toUserId required' });
      return;
    }

    const db = getFirestore();
    let userDoc;

    if (toUserId.includes('@')) {
      const q = await db.collection('members').where('email', '==', toUserId).limit(1).get();
      if (q.empty) {
        res.status(404).json({ error: 'User not found by email' });
        return;
      }
      userDoc = q.docs[0];
    } else {
      userDoc = await db.collection('members').doc(toUserId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
    }

    const fcmToken = userDoc.data().fcmToken;

    if (!fcmToken) {
      res.status(200).json({ skipped: true, reason: 'No token' });
      return;
    }

    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: title || 'Club LC Prado',
        body: body || '',
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};