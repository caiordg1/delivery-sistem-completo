// src/controllers/feedbackController.js

exports.postFeedback = async (req, res) => {
  try {
    const { orderId, userId, rating, comment } = req.body;

    if (!orderId || !userId || !rating) {
      return res.status(400).json({ error: 'Dados incompletos para enviar feedback.' });
    }

    // Aqui você pode salvar no banco (vamos criar o modelo e salvar depois)
    // Por enquanto, vamos só simular o sucesso

    console.log('Feedback recebido:', { orderId, userId, rating, comment });

    return res.status(200).json({ message: 'Feedback enviado com sucesso (simulado).' });
  } catch (error) {
    console.error('Erro ao enviar feedback:', error);
    return res.status(500).json({ error: 'Erro interno ao enviar feedback.' });
  }
};
