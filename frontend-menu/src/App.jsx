import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Phone, ChevronDown, Star, Utensils, Award } from 'lucide-react'

function App() {
  const [produtos, setProdutos] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [categoriaAtiva, setCategoriaAtiva] = useState('pizzas-tradicionais')
  const [dadosCliente, setDadosCliente] = useState({
    nome: '',
    telefone: '',
    endereco: ''
  })
  
  const [showPixGateways, setShowPixGateways] = useState(false)
  const [showCardGateways, setShowCardGateways] = useState(false)
  const [selectedPixGateway, setSelectedPixGateway] = useState('mercadopago')
  const [selectedCardGateway, setSelectedCardGateway] = useState('mercadopago')

  const categorias = [
    { 
      id: 'pizzas-tradicionais', 
      nome: 'Pizzas Tradicionais', 
      icone: '🍕'
    },
    { 
      id: 'pizzas-especiais', 
      nome: 'Pizzas Especiais', 
      icone: '👑'
    },
    { 
      id: 'esfirras', 
      nome: 'Esfirras', 
      icone: '🥟'
    },
    { 
      id: 'refrigerantes', 
      nome: 'Refrigerantes', 
      icone: '🥤'
    }
  ]

  const gateways = [
    { id: 'mercadopago', name: 'MercadoPago', icon: '💳' },
    { id: 'pagseguro', name: 'PagSeguro', icon: '🟡' },
    { id: 'picpay', name: 'PicPay', icon: '💚' }
  ]

  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    try {
      const response = await fetch('https://cardapio.fortalcar.com/api/products')
      const data = await response.json()
      setProdutos(data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([
        { _id: '1', name: 'Pizza Margherita', price: 35.50, description: 'Molho de tomate, mussarela, manjericão fresco', category: 'pizzas-tradicionais' },
        { _id: '2', name: 'Pizza Calabresa', price: 38.00, description: 'Calabresa artesanal, cebola, azeitonas', category: 'pizzas-tradicionais' },
        { _id: '3', name: 'Pizza Portuguesa', price: 42.00, description: 'Presunto, ovos, ervilha, cebola, azeitonas', category: 'pizzas-tradicionais' },
        { _id: '4', name: 'Pizza Quattro Formaggi', price: 55.00, description: 'Gorgonzola, parmesão, mussarela, provolone', category: 'pizzas-especiais' },
        { _id: '5', name: 'Pizza Prosciutto e Rúcula', price: 58.00, description: 'Prosciutto di Parma, rúcula, parmesão', category: 'pizzas-especiais' },
        { _id: '6', name: 'Pizza Salmão', price: 62.00, description: 'Salmão defumado, cream cheese, alcaparras', category: 'pizzas-especiais' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const produtosFiltrados = produtos.filter(produto => {
    if (produto.category) {
      return produto.category === categoriaAtiva
    }
    
    const nome = produto.name.toLowerCase()
    switch (categoriaAtiva) {
      case 'pizzas-tradicionais':
        return nome.includes('pizza') && !nome.includes('especial') && !nome.includes('gourmet')
      case 'pizzas-especiais':
        return nome.includes('pizza') && (nome.includes('especial') || nome.includes('gourmet') || nome.includes('premium'))
      case 'esfirras':
        return nome.includes('esfirra')
      case 'refrigerantes':
        return nome.includes('refrigerante') || nome.includes('coca') || nome.includes('suco') || nome.includes('água')
      default:
        return true
    }
  })

  const adicionarAoCarrinho = (produto) => {
    setCarrinho(prev => {
      const itemExistente = prev.find(item => item._id === produto._id)
      if (itemExistente) {
        return prev.map(item =>
          item._id === produto._id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      } else {
        return [...prev, { ...produto, quantidade: 1 }]
      }
    })
  }

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prev => {
      const item = prev.find(item => item._id === produtoId)
      if (item && item.quantidade > 1) {
        return prev.map(item =>
          item._id === produtoId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
      } else {
        return prev.filter(item => item._id !== produtoId)
      }
    })
  }

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + (item.price * item.quantidade), 0)
  }

  const finalizarPedido = () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item ao carrinho!')
      return
    }

    let message = `🛒 RESUMO DO PEDIDO\n\n📋 Itens selecionados no cardápio:\n`
    message += `🛍️ *Itens do Pedido:*\n`

    carrinho.forEach(item => {
     message += `- ${item.quantidade}x ${item.name} - R$ ${(item.price * item.quantidade).toFixed(2)}\n`
    })

    message += `\n💰Total: R$ ${calcularTotal().toFixed(2).replace('.', ',')}`

    const urlWhatsApp = `https://wa.me/5585989173381?text=${encodeURIComponent(message)}`
    window.open(urlWhatsApp, '_blank')
  }

  const pagarComPix = async (gateway = selectedPixGateway) => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item ao carrinho!')
      return
    }

    try {
      setLoading(true)
      
      const orderData = {
        customerName: dadosCliente.nome,
        customerPhone: dadosCliente.telefone,
        customerAddress: dadosCliente.endereco,
        items: carrinho,
        total: calcularTotal(),
        paymentMethod: 'pix',
        gateway: gateway
      }

      const orderResponse = await fetch('https://cardapio.fortalcar.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const order = await orderResponse.json()
      let pixResponse
      
      switch(gateway) {
        case 'mercadopago':
          pixResponse = await fetch('https://cardapio.fortalcar.com/api/payments/mercadopago/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order._id,
              customerName: dadosCliente.nome,
              customerEmail: dadosCliente.email || 'cliente@exemplo.com',
              total: calcularTotal()
            })
          })
          break
          
        case 'pagseguro':
          pixResponse = await fetch('https://cardapio.fortalcar.com/api/payments/pagseguro/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order._id,
              customerName: dadosCliente.nome,
              customerEmail: dadosCliente.email || 'cliente@exemplo.com',
              customerPhone: dadosCliente.telefone,
              total: calcularTotal()
            })
          })
          break
          
        case 'picpay':
          pixResponse = await fetch('https://cardapio.fortalcar.com/api/payments/picpay/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order._id,
              customerName: dadosCliente.nome,
              customerEmail: dadosCliente.email || 'cliente@exemplo.com',
              customerCPF: '11111111111',
              customerPhone: dadosCliente.telefone,
              total: calcularTotal()
            })
          })
          break
      }
const pixData = await pixResponse.json()

      if (pixData.success) {
        const gatewayName = gateways.find(g => g.id === gateway)?.name || gateway
        
        if (gateway === 'mercadopago') {
          alert(`PIX ${gatewayName} criado! Código: ${pixData.qr_code}`)
        } else if (gateway === 'pagseguro') {
          alert(`Pagamento ${gatewayName} criado! Redirecionando...`)
          window.open(pixData.payment_url, '_blank')
        } else if (gateway === 'picpay') {
          alert(`Pagamento ${gatewayName} criado! Redirecionando...`)
          window.open(pixData.payment_url, '_blank')
        }
        
        setCarrinho([])
        setCarrinhoAberto(false)
      } else {
        alert('Erro ao criar pagamento: ' + pixData.error)
      }

    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const pagarComCartao = async (gateway = selectedCardGateway) => {
    // Similar ao PIX... (função completa)
    alert('Funcionalidade de cartão em desenvolvimento')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #d97706 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #fbbf24',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fef3c7'
          }}>Carregando SAPORE...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #d97706 100%)'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .hover-scale:hover {
          transform: scale(1.02);
        }
        
        .hover-shadow:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .transition-all {
          transition: all 0.3s ease;
        }
        
        .backdrop-blur {
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* HEADER ELEGANTE SAPORE */}
      <header style={{
        background: 'rgba(127, 29, 29, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '2px solid #fbbf24',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* LOGO SAPORE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #eab308 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <Utensils size={32} color="#7f1d1d" />
            </div>
            <div>
              <h1 style={{
                fontSize: '30px',
                fontWeight: 'bold',
                color: '#fef3c7',
                letterSpacing: '0.025em'
              }}>SAPORE</h1>
              <p style={{
                color: '#fcd34d',
                fontSize: '14px',
                fontWeight: '500',
                fontStyle: 'italic'
              }}>O Sabor Italiano</p>
            </div>
          </div>

          {/* BOTÃO CARRINHO */}
          <button
            onClick={() => setCarrinhoAberto(true)}
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
              color: '#7f1d1d',
              padding: '12px 24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            className="hover-scale hover-shadow transition-all"
          >
            <ShoppingCart size={24} />
            <span>Carrinho</span>
            {carrinho.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {carrinho.reduce((sum, item) => sum + item.quantidade, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ABAS DE CATEGORIAS */}
      <section style={{
        background: 'rgba(153, 27, 27, 0.5)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
        position: 'sticky',
        top: '88px',
        zIndex: 30
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto'
          }}>
            {categorias.map(categoria => (
              <button
                key={categoria.id}
                onClick={() => setCategoriaAtiva(categoria.id)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 24px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  borderBottom: categoriaAtiva === categoria.id ? '3px solid #fbbf24' : '3px solid transparent',
                  background: categoriaAtiva === categoria.id ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: categoriaAtiva === categoria.id ? '#fef3c7' : '#fcd34d',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '24px' }}>{categoria.icone}</span>
                <span>{categoria.nome}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '80px 16px',
        textAlign: 'center'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.2)'
        }}></div>
        <div style={{
          position: 'relative',
          maxWidth: '1024px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fcd34d',
            padding: '8px 16px',
            borderRadius: '9999px',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)'
          }}>
            <Award size={20} />
            <span style={{ fontWeight: '500' }}>Delivery Premium</span>
          </div>
          
          <h2 style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#fef3c7',
            marginBottom: '24px',
            lineHeight: '1.1'
          }}>
            Uma Experiência
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Gastronômica
            </span>
          </h2>
          
          <p style={{
            fontSize: '20px',
            color: '#fcd34d',
            marginBottom: '32px',
            maxWidth: '512px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Sabores únicos preparados com ingredientes selecionados e muito amor. 
            Peça agora e transforme seu dia em uma experiência especial.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '24px',
            color: '#fcd34d'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} color="#fbbf24" />
              <span>Avaliação 5 estrelas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#fbbf24" />
              <span>Ingredientes Premium</span>
            </div>
          </div>
        </div>
      </section>
{/* CARDÁPIO */}
      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 16px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '48px' }}>
              {categorias.find(cat => cat.id === categoriaAtiva)?.icone}
            </span>
            <h3 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#fef3c7'
            }}>
              {categorias.find(cat => cat.id === categoriaAtiva)?.nome}
            </h3>
          </div>
          <div style={{
            width: '96px',
            height: '4px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #eab308 100%)',
            margin: '0 auto',
            borderRadius: '2px'
          }}></div>
        </div>

        {produtosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '96px', marginBottom: '16px' }}>
              {categorias.find(cat => cat.id === categoriaAtiva)?.icone}
            </div>
            <p style={{
              fontSize: '24px',
              color: '#fcd34d',
              marginBottom: '8px'
            }}>Em breve...</p>
            <p style={{ color: '#fcd34d' }}>
              Estamos preparando delícias especiais para esta categoria!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px'
          }}>
            {produtosFiltrados.map(produto => (
              <div 
                key={produto._id} 
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  transition: 'all 0.5s ease'
                }}
                className="hover-scale hover-shadow transition-all"
              >
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  {produto.image ? (
                    <img 
                      src={`https://cardapio.fortalcar.com${produto.image}`} 
                      alt={produto.name}
                      style={{
                        width: '100%',
                        height: '224px',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '224px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '96px' }}>
                        {categorias.find(cat => cat.id === categoriaAtiva)?.icone}
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '24px' }}>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#fef3c7',
                    marginBottom: '12px'
                  }}>
                    {produto.name}
                  </h3>
                  <p style={{
                    color: 'rgba(252, 211, 77, 0.8)',
                    marginBottom: '24px',
                    lineHeight: '1.6'
                  }}>
                    {produto.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '30px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        R$ {produto.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => adicionarAoCarrinho(produto)}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
                        color: '#7f1d1d',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      className="hover-scale hover-shadow transition-all"
                    >
                      <Plus size={20} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CARRINHO */}
      {carrinhoAberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
            borderRadius: '16px',
            maxWidth: '512px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <div style={{ padding: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #eab308 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShoppingCart size={24} color="#7f1d1d" />
                  </div>
                  <h2 style={{
                    fontSize: '30px',
                    fontWeight: 'bold',
                    color: '#fef3c7'
                  }}>Seu Pedido</h2>
                </div>
                <button
                  onClick={() => setCarrinhoAberto(false)}
                  style={{
                    color: '#fcd34d',
                    fontSize: '24px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ✕
                </button>
              </div>

              {carrinho.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <ShoppingCart size={64} color="rgba(252, 211, 77, 0.5)" style={{ margin: '0 auto 16px' }} />
                  <p style={{
                    color: '#fcd34d',
                    fontSize: '18px',
                    marginBottom: '8px'
                  }}>Seu carrinho está vazio</p>
                  <p style={{ color: 'rgba(252, 211, 77, 0.7)' }}>
                    Adicione alguns itens deliciosos!
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: '32px' }}>
                  {carrinho.map(item => (
                    <div 
                      key={item._id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontWeight: 'bold',
                          color: '#fef3c7',
                          fontSize: '18px',
                          marginBottom: '4px'
                        }}>{item.name}</h4>
                        <p style={{ color: '#fcd34d', marginBottom: '4px' }}>
                          R$ {item.price.toFixed(2)} cada
                        </p>
                        <p style={{
                          color: '#fcd34d',
                          fontWeight: '500'
                        }}>
                          Total: R$ {(item.price * item.quantidade).toFixed(2)}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <button
                          onClick={() => removerDoCarrinho(item._id)}
                          style={{
                            background: 'rgba(220, 38, 38, 0.2)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Minus size={18} color="#fca5a5" />
                        </button>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '20px',
                          color: '#fef3c7',
                          minWidth: '32px',
                          textAlign: 'center'
                        }}>
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => adicionarAoCarrinho(item)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(251, 191, 36, 0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Plus size={18} color="#fcd34d" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
{carrinho.length > 0 && (
                <div style={{
                  borderTop: '1px solid rgba(251, 191, 36, 0.3)',
                  paddingTop: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '32px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.2) 100%)',
                    borderRadius: '12px'
                  }}>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#fef3c7'
                    }}>Total:</span>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      R$ {calcularTotal().toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                      onClick={finalizarPedido}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                      }}
                      className="hover-scale hover-shadow transition-all"
                    >
                      <Phone size={24} />
                      Finalizar no WhatsApp
                    </button>
                    
                    <div style={{
                      textAlign: 'center',
                      color: '#fcd34d',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      ou pague online com segurança
                    </div>
                    
                    {/* BOTÃO PIX */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowPixGateways(!showPixGateways)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          color: 'white',
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px'
                        }}
                        className="hover-scale hover-shadow transition-all"
                      >
                        💳 Pagar com PIX
                        <ChevronDown 
                          size={20} 
                          style={{
                            transform: showPixGateways ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                      </button>
                      
                      {showPixGateways && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          width: '100%',
                          background: 'rgba(153, 27, 27, 0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                          zIndex: 10,
                          marginTop: '8px'
                        }}>
                          {gateways.map(gateway => (
                            <button
                              key={gateway.id}
                              onClick={() => {
                                setSelectedPixGateway(gateway.id)
                                setShowPixGateways(false)
                                pagarComPix(gateway.id)
                              }}
                              style={{
                                width: '100%',
                                padding: '16px',
                                textAlign: 'left',
                                background: selectedPixGateway === gateway.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                                borderLeft: selectedPixGateway === gateway.id ? '4px solid #3b82f6' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                transition: 'all 0.3s ease',
                                borderRadius: gateway === gateways[0] ? '12px 12px 0 0' : gateway === gateways[gateways.length - 1] ? '0 0 12px 12px' : '0'
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>{gateway.icon}</span>
                              <span style={{
                                fontWeight: '500',
                                color: '#fef3c7'
                              }}>{gateway.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* BOTÃO CARTÃO */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowCardGateways(!showCardGateways)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                          color: 'white',
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px'
                        }}
                        className="hover-scale hover-shadow transition-all"
                      >
                        💸 Pagar com Cartão
                        <ChevronDown 
                          size={20}
                          style={{
                            transform: showCardGateways ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                      </button>
                      
                      {showCardGateways && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          width: '100%',
                          background: 'rgba(153, 27, 27, 0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                          zIndex: 10,
                          marginTop: '8px'
                        }}>
                          {gateways.map(gateway => (
                            <button
                              key={gateway.id}
                              onClick={() => {
                                setSelectedCardGateway(gateway.id)
                                setShowCardGateways(false)
                                pagarComCartao(gateway.id)
                              }}
                              style={{
                                width: '100%',
                                padding: '16px',
                                textAlign: 'left',
                                background: selectedCardGateway === gateway.id ? 'rgba(147, 51, 234, 0.2)' : 'transparent',
                                borderLeft: selectedCardGateway === gateway.id ? '4px solid #8b5cf6' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                transition: 'all 0.3s ease',
                                borderRadius: gateway === gateways[0] ? '12px 12px 0 0' : gateway === gateways[gateways.length - 1] ? '0 0 12px 12px' : '0'
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>{gateway.icon}</span>
                              <span style={{
                                fontWeight: '500',
                                color: '#fef3c7'
                              }}>{gateway.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
