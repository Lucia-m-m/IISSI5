import { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, Pressable, View } from 'react-native'

import { getAll, remove } from '../../api/RestaurantEndpoints'
import ImageCard from '../../components/ImageCard'
import TextSemiBold from '../../components/TextSemiBold'
import TextRegular from '../../components/TextRegular'
import DeleteModal from '../../components/DeleteModal'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import { API_BASE_URL } from '@env'

export default function RestaurantsScreen({ navigation, route }) {
  const [restaurants, setRestaurants] = useState([])
  const [restaurantToBeDeleted, setRestaurantToBeDeleted] = useState(null) //se inicializa con el estado null, cuando se pulse el boton delete pasara a True, en restaurantToBeDeleted metemos el restaurante selleccionado
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchRestaurants()
    } else {
      setRestaurants(null)
    }
  }, [loggedInUser, route])

  const renderRestaurant = ({ item }) => {
    return (
      <ImageCard
        imageUri={
          item.logo ? { uri: API_BASE_URL + '/' + item.logo } : restaurantLogo
        }
        title={item.name}
        onPress={() => {
          navigation.navigate('RestaurantDetailScreen', { id: item.id })
        }}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        {item.averageServiceMinutes !== null && (
          <TextSemiBold>
            Avg. service time:{' '}
            <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>
              {item.averageServiceMinutes} min.
            </TextSemiBold>
          </TextSemiBold>
        )}
        <TextSemiBold>
          Shipping:{' '}
          <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>
            {item.shippingCosts.toFixed(2)}€
          </TextSemiBold>
        </TextSemiBold>
        <View style={styles.actionButtonsContainer}>
          <Pressable
            onPress={
              () => navigation.navigate('EditRestaurantScreen', { id: item.id }) //cuando se pulsa nos lleva a EditRestaurantScreen del restaurnat que corresponda la id
            }
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandBlueTap
                  : GlobalStyles.brandBlue
              },
              styles.actionButton
            ]}
          >
            <View
              style={[
                { flex: 1, flexDirection: 'row', justifyContent: 'center' }
              ]}
            >
              <MaterialCommunityIcons name="pencil" color={'white'} size={20} />
              <TextRegular textStyle={styles.text}>Edit</TextRegular>
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              setRestaurantToBeDeleted(item) //cuando presionamos, el restaurante seleccionado para a estar en restaurantToBeDeleted
            }}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandPrimaryTap
                  : GlobalStyles.brandPrimary
              },
              styles.actionButton
            ]}
          >
            <View
              style={[
                { flex: 1, flexDirection: 'row', justifyContent: 'center' }
              ]}
            >
              <MaterialCommunityIcons name="delete" color={'white'} size={20} />
              <TextRegular textStyle={styles.text}>Delete</TextRegular>
            </View>
          </Pressable>
        </View>
      </ImageCard>
    )
  }
  const removeRestaurant = async restaurant => {
    try {
      await remove(restaurant.id) //await se hace porque hace operaciones asincronas, ejecuta una tarea que tarda tiempo sin bloquear el resto de la aplicacion, poner cuando es cosas de fuera de mi codigo, llamadas a backend por ejemplo
      await fetchRestaurants() //pide los restaurante actualizado
      setRestaurantToBeDeleted(null) //limpia el estado asi no queda seleccionado un restaurante ya eliminado
      showMessage({
        message: `Restaurant ${restaurant.name} successfully removed`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      console.log(error)
      setRestaurantToBeDeleted(null)
      showMessage({
        message: `Restaurant ${restaurant.name} could not be removed.`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }
  const renderEmptyRestaurantsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No restaurants were retreived. Are you logged in?
      </TextRegular>
    )
  }

  const renderHeader = () => {
    return (
      <>
        {loggedInUser && (
          <Pressable
            onPress={() => navigation.navigate('CreateRestaurantScreen')}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandGreenTap
                  : GlobalStyles.brandGreen
              },
              styles.button
            ]}
          >
            <View
              style={[
                { flex: 1, flexDirection: 'row', justifyContent: 'center' }
              ]}
            >
              <MaterialCommunityIcons
                name="plus-circle"
                color={'white'}
                size={20}
              />
              <TextRegular textStyle={styles.text}>
                Create restaurant
              </TextRegular>
            </View>
          </Pressable>
        )}
      </>
    )
  }
  const fetchRestaurants = async () => {
    //coge todos los restaurnantes y hace un setRestaurants
    try {
      const fetchedRestaurants = await getAll()
      setRestaurants(fetchedRestaurants)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurants. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <>
      <FlatList
        style={styles.container}
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyRestaurantsList}
      />
      <DeleteModal
        isVisible={restaurantToBeDeleted !== null} //muestra el restaurante que queremos eliminar si es diferente de null.
        onCancel={() => setRestaurantToBeDeleted(null)} //cuando se pulsa cancelar el restaurante pasa a ser null en setRestaurantToBeDeleted(null), isvisible pasa a ser false
        onConfirm={() => removeRestaurant(restaurantToBeDeleted)} //se hace la funcionremoveRestaurant u le pasa el restaurante seleccionado
      >
        <TextRegular>
          The products of this restaurant will be deleted as well
        </TextRegular>
        <TextRegular>
          If the restaurant has orders, it cannot be deleted.
        </TextRegular>
      </DeleteModal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%'
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
