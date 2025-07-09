// /frontend-admin/src/components/bot/BotQRCode.jsx
import React from 'react';

const BotQRCode = ({ qrCode, status, onRefreshQR, isLoading }) => {
  
  // Só mostra o QR quando o status for connecting ou disconnected
  const shouldShowQR = status === 'connecting' || status === 'disconnected' || status === 'waiting_qr';

  if (!shouldShowQR) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📱 QR Code WhatsApp
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500">
            {status === 'connected' ? (
              <div>
                <span className="text-green-600 text-2xl">✅</span>
                <p className="mt-2">Bot conectado com sucesso!</p>
              </div>
            ) : (
              <p>QR Code não necessário no momento</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          📱 QR Code WhatsApp
        </h3>
        <button
          onClick={onRefreshQR}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          🔄 Atualizar
        </button>
      </div>

      <div className="text-center">
        {isLoading ? (
          <div className="py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando QR Code...</p>
          </div>
        ) : qrCode ? (
          <div>
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img 
                src={`data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>📲 Como usar:</strong>
              </p>
              <ol className="text-sm text-blue-600 mt-2 text-left space-y-1">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Vá em Configurações → Aparelhos conectados</li>
                <li>3. Toque em "Conectar um aparelho"</li>
                <li>4. Escaneie este QR Code</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-gray-400 text-4xl mb-4">📱</div>
            <p className="text-gray-600">Nenhum QR Code disponível</p>
            <p className="text-sm text-gray-500 mt-2">
              Clique em "Iniciar" para gerar um novo QR Code
            </p>
          </div>
        )}
      </div>

      {qrCode && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⏰ <strong>Atenção:</strong> Este QR Code expira em 2 minutos. 
            Se não conseguir escanear, clique em "Atualizar" para gerar um novo.
          </p>
        </div>
      )}
    </div>
  );
};

export default BotQRCode;
