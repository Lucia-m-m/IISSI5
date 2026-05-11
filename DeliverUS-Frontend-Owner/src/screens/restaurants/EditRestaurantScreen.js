import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as yup from 'yup'
import DropDownPicker from 'react-native-dropdown-picker'
import {
  getRestaurantCategories,
  getDetail,
  update
} from '../../api/RestaurantEndpoints'
import InputItem from '../../components/InputItem'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import restaurantBackground from '../../../assets/restaurantBackground.jpeg'
import { showMessage } from 'react-native-flash-message'
import { ErrorMessage, Formik } from 'formik'
import TextError from '../../components/TextError'
import { prepareEntityImages } from '../../api/helpers/FileUploadHelper'
import { buildInitialValues } from '../Helper'
import ImagePicker from '../../components/ImagePicker'

export default function EditRestaurantScreen({ navigation, route }) {
  const [open, setOpen] = useState(false)
  const [restaurantCategories, setRestaurantCategories] = useState([])
  const [backendErrors, setBackendErrors] = useState()
  const [restaurant, setRestaurant] = useState({})

  const [initialRestaurantValues, setInitialRestaurantValues] = useState({
    name: null,
    description: null,
    address: null,
    postalCode: null,
    url: null,
    shippingCosts: null,
    email: null,
    phone: null,
    restaurantCategoryId: null,
    logo: null,
    heroImage: null
  })
  const validationSchema = yup.object().shape({
    name: yup.string().max(255, 'Name too long').required('Name is required'),
    address: yup
      .string()
      .max(255, 'Address too long')
      .required('Address is required'),
    postalCode: yup
      .string()
      .max(255, 'Postal code too long')
      .required('Postal code is required'),
    url: yup.string().nullable().url('Please enter a valid url'),
    shippingCosts: yup
      .number()
      .positive('Please provide a valid shipping cost value')
      .required('Shipping costs value is required'),
    email: yup.string().nullable().email('Please enter a valid email'),
    phone: yup.string().nullable().max(255, 'Phone too long'),
    restaurantCategoryId: yup
      .number()
      .positive()
      .integer()
      .required('Restaurant category is required')
  })
  const updateRestaurant = async values => {
    setBackendErrors([])
    try {
      const updatedRestaurant = await update(restaurant.id, values)
      showMessage({
        message: `Restaurant ${updatedRestaurant.name} succesfully updated`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('RestaurantsScreen', { dirty: true })
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }
  useEffect(() => {
    //se utiliza cuando la panatalla se carga(o cambia a route)
    async function fetchRestaurantDetail() {
      try {
        const fetchedRestaurant = await getDetail(route.params.id) //pide datos a backend, procesarlos, guardarlos en el estado //route.params.id id que enviaste desde la pantalla anterior, getDetail(id) llama al backend
        const preparedRestaurant = prepareEntityImages(fetchedRestaurant, [
          //convierte campos como: logo y heroImage en url validas para mostrar imagenes
          'logo',
          'heroImage'
        ])
        setRestaurant(preparedRestaurant)
        const initialValues = buildInitialValues(
          //coge la plantlla del formulario cuando esta vacia y la utiliza para establecer los nuevos datos del backend
          preparedRestaurant, //datos reales del backend
          initialRestaurantValues //define como es el formato(formulario, cuando esta vacio )
        )
        setInitialRestaurantValues(initialValues)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchRestaurantDetail()
  }, [route]) //ejecuta esto cuando route cambie

  return (
    <Formik
      validationSchema={validationSchema}
      // include the formik properties here
      enableReinitialize //Si cambian los initialValues, vuelve a inicializar el formulario.”
      initialValues={initialRestaurantValues} //“Estos son los valores iniciales de los inputs.””
      onSubmit={updateRestaurant} //Cuando el usuario pulse guardar, ejecuta esta función
    >
      {({ handleSubmit, setFieldValue, values }) => (
        <ScrollView>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: '60%' }}>
              <InputItem name="name" label="Name:" />
              <InputItem name="description" label="Description:" />
              <InputItem name="address" label="Address:" />
              <InputItem name="postalCode" label="Postal code:" />
              <InputItem name="url" label="Url:" />
              <InputItem name="shippingCosts" label="Shipping costs:" />
              <InputItem name="email" label="Email:" />
              <InputItem name="phone" label="Phone:" />

              <DropDownPicker
                open={open}
                value={values.restaurantCategoryId}
                items={restaurantCategories}
                setOpen={setOpen}
                onSelectItem={item => {
                  setFieldValue('restaurantCategoryId', item.value)
                }}
                setItems={setRestaurantCategories}
                placeholder="Select the restaurant category"
                containerStyle={{ height: 40, marginTop: 20 }}
                style={{ backgroundColor: GlobalStyles.brandBackground }}
                dropDownStyle={{ backgroundColor: '#fafafa' }}
              />
              <ErrorMessage
                name={'restaurantCategoryId'}
                render={msg => <TextError>{msg}</TextError>}
              />

              <ImagePicker
                label="Logo:"
                image={values.logo}
                defaultImage={restaurantLogo}
                onImagePicked={result => setFieldValue('logo', result)}
              />

              <ImagePicker
                label="Hero Image:"
                image={values.heroImage}
                defaultImage={restaurantBackground}
                onImagePicked={result => setFieldValue('heroImage', result)}
              />

              {backendErrors &&
                backendErrors.map((error, index) => (
                  <TextError key={index}>
                    {error.param}-{error.msg}
                  </TextError>
                ))}

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? GlobalStyles.brandSuccessTap
                      : GlobalStyles.brandSuccess
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
                    name="content-save"
                    color={'white'}
                    size={20}
                  />
                  <TextRegular textStyle={styles.text}>Save</TextRegular>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </Formik>
  )
}
const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    height: 40,
    padding: 10,
    width: '100%',
    marginTop: 20,
    marginBottom: 20
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginLeft: 5
  },
  imagePicker: {
    height: 40,
    paddingLeft: 10,
    marginTop: 20,
    marginBottom: 80
  },
  image: {
    width: 100,
    height: 100,
    borderWidth: 1,
    alignSelf: 'center',
    marginTop: 5
  }
})
