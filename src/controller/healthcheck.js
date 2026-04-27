const axios = require('axios');

exports.healthCheck = async (req, res) => {
  try {
    res.status(200).send('OK');
  } catch (error) {
    res.status(417).send('Not Okay');
  }
};

exports.portainerHealth = async (req, res) => {
  try {
    await axios.get('http://localhost:6789/k8s/metrics', { timeout: 9000 });

    res.status(200).json({
      status: 'ready',
      checks: {
        api: 'ok',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'not_ready',
      error: error.message,
    });
  }
};
