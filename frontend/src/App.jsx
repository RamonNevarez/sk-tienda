import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  Drawer,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Stack,
  Snackbar,
  Toolbar,
  Typography,
  TextField,
  MenuItem,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import AdminPanel from './AdminPanel.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const PRODUCT_PLACEHOLDER = '/placeholder-product.svg'
const STORE_CATEGORIES = ['Bolsos', 'Carteras', 'Tarjeteros', 'Accesorios']
const ALPHABET = [...'ABCDEFGHIJKLMN', 'Ñ', ...'OPQRSTUVWXYZ']
const CATEGORY_ALIASES = {
  bolso: 'Bolsos',
  cartera: 'Carteras',
  tarjetero: 'Tarjeteros',
  accesorio: 'Accesorios',
}

const normalizeCategory = (name) => {
  const normalized = String(name || '').trim().toLocaleLowerCase('es')
  return STORE_CATEGORIES.find((category) => category.toLocaleLowerCase('es') === normalized)
    || CATEGORY_ALIASES[normalized]
    || name
}

const isLetterAccessory = (product) =>
  normalizeCategory(product.category) === 'Accesorios'
  && product.name.trim().toLocaleLowerCase('es').startsWith('letra')

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)

const getUnitPrice = (item) => {
  if (item.quantity >= item.wholesaleMinQty) {
    return item.wholesalePrice ?? item.price
  }

  return item.price
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(['Todos', ...STORE_CATEGORIES])
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [variantQuantities, setVariantQuantities] = useState({})
  const [selectedLetters, setSelectedLetters] = useState({})
  const [activeLetter, setActiveLetter] = useState('')
  const [loading, setLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [addedMessage, setAddedMessage] = useState('')
  const [orderError, setOrderError] = useState('')
  const [sendingOrder, setSendingOrder] = useState(false)
  const [cart, setCart] = useState([])

  useEffect(() => {
    if (location.pathname !== '/') return

    const loadCatalog = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/categories`),
        ])

        if (!productsResponse.ok || !categoriesResponse.ok) {
          throw new Error('No se pudo cargar el catálogo')
        }

        const [apiProducts, apiCategories] = await Promise.all([
          productsResponse.json(),
          categoriesResponse.json(),
        ])
        const categoryNames = Object.fromEntries(apiCategories.map((category) => [category.id, category.name]))
        const normalizedProducts = apiProducts.map((product) => ({
          ...product,
          category: normalizeCategory(categoryNames[product.category_id] || 'Sin categoría'),
          wholesalePrice: product.wholesale_price,
          wholesaleMinQty: product.wholesale_min_qty || 6,
          image: product.image_url || PRODUCT_PLACEHOLDER,
          variants: product.variants.map((variant) => ({
            ...variant,
            image: variant.image_url || product.image_url || PRODUCT_PLACEHOLDER,
            wholesalePrice: variant.wholesale_price,
            wholesaleMinQty: variant.wholesale_min_qty || 6,
          })),
        }))

        setProducts(normalizedProducts)
        setCategories(['Todos', ...STORE_CATEGORIES])
        setCatalogError('')
      } catch {
        setCatalogError('No se pudo conectar con el catálogo. Mostrando datos de ejemplo.')
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [location.pathname])

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory
      const searchableText = [
        product.name,
        product.category,
        ...product.variants.map((variant) => variant.name),
      ].join(' ').toLocaleLowerCase()
      return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch))
    })
  }, [products, searchTerm, selectedCategory])

  const addToCart = (product, variant, quantity = 1, selectedLetter = null) => {
    if (!product.available || !variant.available || quantity <= 0) return

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.variantId === variant.id && item.selectedLetter === selectedLetter,
      )

      if (existingItem) {
        return currentCart.map((item) =>
          item.variantId === variant.id && item.selectedLetter === selectedLetter
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }

      return [
        ...currentCart,
        {
          id: product.id,
          variantId: variant.id,
          name: product.name,
          variantName: variant.name,
          selectedLetter,
          price: variant.price,
          wholesalePrice: variant.wholesalePrice,
          wholesaleMinQty: variant.wholesaleMinQty,
          quantity,
        },
      ]
    })

    setAddedMessage(`${product.name} - ${variant.name}${selectedLetter ? ` (Letra ${selectedLetter})` : ''} se agregó al carrito`)
  }

  const openProductVariants = (product, letter = '') => {
    setSelectedProduct(product)
    setActiveLetter(letter)
    setVariantQuantities(Object.fromEntries(
      product.variants.map((variant) => [variant.id, 0]),
    ))
  }

  const updateVariantQuantity = (variantId, delta) => {
    setVariantQuantities((current) => ({
      ...current,
      [variantId]: Math.max(0, (current[variantId] || 0) + delta),
    }))
  }

  const addSelectedVariants = () => {
    if (!selectedProduct) return
    const selected = selectedProduct.variants.filter((variant) => (variantQuantities[variant.id] || 0) > 0)
    const letter = isLetterAccessory(selectedProduct) ? activeLetter : null
    selected.forEach((variant) => addToCart(selectedProduct, variant, variantQuantities[variant.id], letter))
    if (selected.length > 0) {
      const totalUnits = selected.reduce((sum, variant) => sum + variantQuantities[variant.id], 0)
      setAddedMessage(`${totalUnits} artículo(s) de ${selectedProduct.name} se agregaron al carrito`)
      setSelectedProduct(null)
    }
  }

  const updateQuantity = (variantId, selectedLetter, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.variantId === variantId && item.selectedLetter === selectedLetter
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const total = cart.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0)

  const createWhatsAppMessage = async () => {
    setOrderError('')
    setSendingOrder(true)
    const whatsappWindow = window.open('about:blank', '_blank')
    const lines = cart.map((item) => {
      const letterLabel = item.selectedLetter ? ` (Letra ${item.selectedLetter})` : ''
      return `• ${item.quantity} × ${item.name} - ${item.variantName}${letterLabel} — ${formatCurrency(getUnitPrice(item) * item.quantity)}`
    })
    const message = `Hola, quiero realizar el siguiente pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatCurrency(total)}`
    const whatsappNumber = '526678435976'
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product_id: item.id,
            variant_id: item.variantId,
            quantity: item.quantity,
            selected_letter: item.selectedLetter,
          })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar el pedido')
      if (whatsappWindow) whatsappWindow.location.href = url
      else window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      whatsappWindow?.close()
      setOrderError(error.message || 'No se pudo enviar el pedido')
    } finally {
      setSendingOrder(false)
    }
  }

  if (location.pathname === '/admin') {
    return (
      <AdminPanel
        onClose={() => navigate('/')}
      />
    )
  }

  return (
    <>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: '1px solid rgba(91, 37, 57, 0.16)' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="SK Bolsos Personalizados"
              sx={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="secondary"
              onClick={() => setCartOpen(true)}
              sx={{
                backgroundColor: 'rgba(210, 137, 165, 0.18)',
                borderRadius: 2,
                width: 48,
                height: 48,
                position: 'relative',
              }}
              aria-label="Abrir carrito"
            >
              <Badge
                badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)}
                color="error"
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '2rem', sm: '3rem' } }}>
            SK Bolsos Personalizados
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bolsos, carteras y accesorios personalizados.
          </Typography>
        </Box>

          {loading && <Alert severity="info" sx={{ mb: 3 }}>Cargando catálogo...</Alert>}
          {catalogError && <Alert severity="warning" sx={{ mb: 3 }}>{catalogError}</Alert>}

        <Stack
          direction="row"
          spacing={0}
          sx={{
            mb: 3,
            width: '100%',
            flexWrap: { xs: 'nowrap', sm: 'wrap' },
            justifyContent: 'flex-start',
            overflowX: { xs: 'auto', sm: 'visible' },
            overflowY: 'hidden',
            columnGap: 1,
            rowGap: 1,
            pb: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              clickable
              onClick={() => setSelectedCategory(category)}
              sx={{ width: 'auto', flexShrink: 0, justifyContent: 'center' }}
            />
          ))}
        </Stack>

        <TextField
          fullWidth
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar productos o variantes"
          aria-label="Buscar productos o variantes"
          sx={{ mb: 4 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} aria-label="Limpiar búsqueda" edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {orderError && <Alert severity="error" sx={{ mb: 3 }}>{orderError}</Alert>}

        <Grid container spacing={{ xs: 1.5, sm: 3 }}>
          {visibleProducts.map((product) => {
            const primaryVariant = product.variants[0]
            const singleAvailableVariant = product.variants.length === 1 ? product.variants[0] : null
            const hasMultipleVariants = product.variants.length > 1
            const letterProduct = isLetterAccessory(product)
            const selectedLetter = selectedLetters[product.id] || ''
            const productImage = (
              <CardMedia
                component="img"
                image={primaryVariant?.image || product.image || PRODUCT_PLACEHOLDER}
                alt={product.name}
                sx={{ height: { xs: 132, sm: 190, md: 220 }, objectFit: 'cover' }}
              />
            )

            return (
              <Grid size={{ xs: 6, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {hasMultipleVariants ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => openProductVariants(product, letterProduct ? selectedLetter : '')}
                      aria-label={`Ver variantes de ${product.name}`}
                      sx={{
                        display: 'block',
                        width: '100%',
                        p: 0,
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                        lineHeight: 0,
                        '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: -3 },
                      }}
                    >
                      {productImage}
                    </Box>
                  ) : productImage}
                  <CardContent sx={{ flexGrow: 1, p: { xs: 1.25, sm: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5, mb: 1 }}>
                      <Typography variant="h6" component="h2" sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                        {product.name}
                      </Typography>
                      {product.available ? (
                        <Chip label="Disponible" color="success" size="small" sx={{ height: { xs: 20, sm: 24 }, '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } } }} />
                      ) : (
                        <Chip label="Sin stock" color="error" size="small" sx={{ height: { xs: 20, sm: 24 }, '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } } }} />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}>
                      {product.description}
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                      {singleAvailableVariant ? formatCurrency(singleAvailableVariant.price) : `Desde ${formatCurrency(primaryVariant?.price || product.price)}`}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>
                      {singleAvailableVariant
                        ? singleAvailableVariant.wholesalePrice != null
                          ? `Mayoreo desde ${singleAvailableVariant.wholesaleMinQty} piezas: ${formatCurrency(singleAvailableVariant.wholesalePrice)}`
                          : `Presentación: ${singleAvailableVariant.name}`
                        : `${product.variants.length} variantes`}
                    </Typography>
                    {letterProduct && (
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Letra"
                        value={selectedLetter}
                        onChange={(event) => setSelectedLetters((current) => ({ ...current, [product.id]: event.target.value }))}
                        sx={{ mt: 1.5 }}
                      >
                        {ALPHABET.map((letter) => <MenuItem key={letter} value={letter}>{letter}</MenuItem>)}
                      </TextField>
                    )}
                  </CardContent>

                  <CardActions
                    disableSpacing
                    sx={{
                      px: { xs: 1.25, sm: 2 },
                      pb: { xs: 1.25, sm: 2 },
                      pt: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        if (letterProduct && !selectedLetter) return
                        if (singleAvailableVariant) {
                          addToCart(product, singleAvailableVariant, 1, letterProduct ? selectedLetter : null)
                          return
                        }
                        openProductVariants(product, letterProduct ? selectedLetter : '')
                      }}
                      disabled={
                        !product.variants.some((variant) => variant.available)
                        || (letterProduct && !selectedLetter)
                      }
                      sx={{
                        alignSelf: 'center',
                        width: '100%',
                        fontSize: { xs: '0.72rem', sm: '0.875rem' },
                        px: { xs: 0.5, sm: 2 },
                        minHeight: { xs: 38, sm: 42 },
                      }}
                    >
                      {singleAvailableVariant ? 'Agregar' : 'Ver variantes'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )
          })}
        </Grid>
        {!loading && !catalogError && products.length === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Todavía no hay productos publicados.
          </Alert>
        )}
        {!loading && products.length > 0 && visibleProducts.length === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            No encontramos productos con esos criterios.
          </Alert>
        )}
      </Container>

      <Dialog open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedProduct?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isLetterAccessory(selectedProduct || { category: '', name: '' })
              ? 'Elige una letra y una variante para agregar al carrito.'
              : 'Selecciona una variante para agregarla al carrito.'}
          </Typography>
          {isLetterAccessory(selectedProduct || { category: '', name: '' }) && (
            <TextField
              select
              fullWidth
              label="Letra"
              value={activeLetter}
              onChange={(event) => setActiveLetter(event.target.value)}
              sx={{ mb: 2 }}
            >
              {ALPHABET.map((letter) => <MenuItem key={letter} value={letter}>{letter}</MenuItem>)}
            </TextField>
          )}
          <Grid container spacing={2}>
            {selectedProduct?.variants.map((variant) => (
              <Grid size={{ xs: 6, sm: 6 }} key={variant.id}>
                <Card variant="outlined" sx={{ height: '100%', minWidth: 0, overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={variant.image || PRODUCT_PLACEHOLDER}
                    alt={variant.name}
                    sx={{ height: { xs: 105, sm: 170 }, objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: { xs: 1, sm: 2 }, minWidth: 0, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                      {variant.name}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.25rem' }, mt: 0.5 }}>
                      {formatCurrency(variant.price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1.25 }}>
                      Mayoreo desde {variant.wholesaleMinQty} unidades: {formatCurrency(variant.wholesalePrice)}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        alignItems: 'center',
                        justifyItems: 'center',
                        width: '100%',
                        minWidth: 0,
                        gap: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{ width: 38, height: 38, border: '1px solid', borderColor: 'divider', justifySelf: 'start' }}
                        onClick={() => updateVariantQuantity(variant.id, -1)}
                        disabled={!variant.available || !(variantQuantities[variant.id] > 0)}
                        aria-label={`Restar ${variant.name}`}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700, lineHeight: 1 }}>
                        {variantQuantities[variant.id] ?? (variant.available ? 1 : 0)}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ width: 38, height: 38, border: '1px solid', borderColor: 'divider', justifySelf: 'end' }}
                        onClick={() => updateVariantQuantity(variant.id, 1)}
                        disabled={!variant.available}
                        aria-label={`Sumar ${variant.name}`}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: { xs: 1, sm: 1.5 }, width: '100%', minWidth: 0, whiteSpace: 'normal', lineHeight: 1.1, fontSize: { xs: '0.68rem', sm: '0.875rem' }, px: { xs: 0.5, sm: 2 } }}
                      onClick={() => {
                        const quantity = variantQuantities[variant.id] || 1
                        addToCart(selectedProduct, variant, quantity, isLetterAccessory(selectedProduct) ? activeLetter : null)
                        setVariantQuantities((current) => ({ ...current, [variant.id]: 0 }))
                      }}
                      disabled={
                        !variant.available
                        || (isLetterAccessory(selectedProduct || { category: '', name: '' }) && !activeLetter)
                      }
                    >
                      Agregar al carrito
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={addSelectedVariants}
                  disabled={
                    !Object.values(variantQuantities).some((quantity) => quantity > 0)
                    || (isLetterAccessory(selectedProduct || { category: '', name: '' }) && !activeLetter)
                  }
          >
            Agregar seleccionados
          </Button>
        </DialogContent>
      </Dialog>

      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: 380, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Carrito
            </Typography>
            <IconButton onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">
              ✕
            </IconButton>
          </Box>

          {cart.length === 0 ? (
            <Typography color="text.secondary">Tu carrito está vacío.</Typography>
          ) : (
            <List disablePadding>
              {cart.map((item) => {
                const itemTotal = getUnitPrice(item) * item.quantity

                return (
                  <ListItem key={`${item.id}-${item.variantId}-${item.selectedLetter || ''}`} disableGutters sx={{ display: 'block', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ListItemText
                        primary={`${item.name} - ${item.variantName}${item.selectedLetter ? ` (Letra ${item.selectedLetter})` : ''}`}
                        secondary={
                          item.quantity >= item.wholesaleMinQty
                            ? `Precio mayoreo: ${formatCurrency(getUnitPrice(item))}`
                            : `Precio: ${formatCurrency(getUnitPrice(item))}`
                        }
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={() => updateQuantity(item.variantId, item.selectedLetter, -1)} aria-label="restar cantidad">
                          −
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton onClick={() => updateQuantity(item.variantId, item.selectedLetter, 1)} aria-label="sumar cantidad">
                          +
                        </IconButton>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(itemTotal)}
                      </Typography>
                    </Box>
                  </ListItem>
                )
              })}
            </List>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatCurrency(total)}
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={createWhatsAppMessage}
            disabled={cart.length === 0 || sendingOrder}
          >
            {sendingOrder ? 'Registrando pedido...' : 'Pedir por WhatsApp'}
          </Button>
        </Box>
      </Drawer>

      <Snackbar
        open={Boolean(addedMessage)}
        autoHideDuration={2400}
        onClose={() => setAddedMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setAddedMessage('')} severity="success" variant="filled" sx={{ width: '100%' }}>
          {addedMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default App
