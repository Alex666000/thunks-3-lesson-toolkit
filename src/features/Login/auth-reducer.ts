import {setAppStatusAC} from "../../app/app-reducer"
import {authAPI, FieldErrorType, LoginParamsType} from "../../api/todolists-api"
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils"
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {AxiosError} from "axios";
// называем санку-тулкита так: сначала name слайса,потом название санки без ТС
// первым параметром принимает: название редюсера и санки
//  во 2 параметр придут параметры что прихолили в ТС:
// если придет несколько параметров то их передаем  внутри объекта payload
// интерфейс взаимодействия с санкой thunkAPI - деструктурируем его
// типизируем санку если она обрабатывает ошибки которые нужны на UI - формик дожидается результата action если
// если может быть ошибка у пользователя при результате отработки санки этой то try catch оборачиваем
// и возвращаем return (из АС что принадлежит мне моей санки...) иначе в extraReducers в payload будет ошибка ТС
// удаляем типы снизу АС-ов..
// переносим логику АС из reducers в extraReducers, а АС из reducers удаляем, удаляем АС их экспорта этого файла, фиксим импорты и тесты
// проверяем как работате в браузере

export const loginTC = createAsyncThunk<undefined, LoginParamsType, {
    rejectValue?: { error: string[], fieldsErrors?: Array<FieldErrorType> }
}>("auth/login", async (param, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: "loading"}))
    try {
        const res = await authAPI.login(param)
        if (res.data.resultCode === 0) {
            thunkAPI.dispatch(setAppStatusAC({status: "succeeded"}))
            // thunkAPI.dispatch(setIsLoggedInAC({value: true}))
            return
        } else {
            handleServerAppError(res.data, thunkAPI.dispatch)
            // так как с UI придет ошибка - обработаем её т к не попали в if
            // если ошибка -- возвращаем всегда объект
            // return thunkAPI.rejectWithValue({someError: "some error"})

            // обработаем ошибку с сервака что пришла нам тут: const res = await authAPI.login(param)
            // тоже объект вернем у которого значения см. в preview network
            return thunkAPI.rejectWithValue({errors: res.data.messages, fieldsErrors: res.data.fieldsErrors})
        }
    } catch (err) {
        // т.к AxiosError - ошибка ---> поэтому лайфак переопределим error на err
        const error: AxiosError = err
        // далее испольуем уже error:
        handleServerNetworkError(error, thunkAPI.dispatch)
        // явно укажем  fieldsError: undefined
        // упаковываем данные ДТО...чем возвращать весь error...
        return thunkAPI.rejectWithValue({error: [error.message], fieldsErrors: undefined})
    }
})

export const logoutTC = createAsyncThunk("auth/logout", async (param, {dispatch, rejectWithValue}) => {
    dispatch(setAppStatusAC({status: "loading"}))
    try {
        const res = await authAPI.logout()
        if (res.data.resultCode === 0) {
            dispatch(setIsLoggedInAC({value: false}))
            dispatch(setAppStatusAC({status: "succeeded"}))
            return
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue({})
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue({})
    }
})

const slice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false
    },
    reducers: {
        setIsLoggedInAC(state, action: PayloadAction<{ value: boolean }>) {
            state.isLoggedIn = action.payload.value
        }
    },
    extraReducers: (builder) => {
        // action не используемся можно удалить но не будем:
        builder.addCase(loginTC.fulfilled, (state, action) => {
            state.isLoggedIn = true
        });
        // action не используемся можно удалить но не будем:
        builder.addCase(logoutTC.fulfilled, (state, action) => {
            state.isLoggedIn = false
        });
    }
})

export const authReducer = slice.reducer
export const {setIsLoggedInAC} = slice.actions

// thunks


/*
const a1 = {
    type: "SET-IS-LOGIN-IN",
    payload: {
        value: true
    }
}
const a2 = {
    type: "SET-blabal",
    payload: {
        user: {name: "sdsd"},
        age: 12
    }
}
*/

/*
- DTO – переход объектом из одного слоя в другой чтобы они были стандартизированы
 */
