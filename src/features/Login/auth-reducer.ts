import {Dispatch} from "redux"
import {SetAppErrorActionType, setAppStatusAC, SetAppStatusActionType} from "../../app/app-reducer"
import {authAPI, FieldErrorType, LoginParamsType} from "../../api/todolists-api"
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils"
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {addTodolistAC} from "../TodolistsList/todolists-reducer";
import {AxiosError} from "axios";

export const loginTC = createAsyncThunk<{isLoggedIn: boolean}, LoginParamsType, {
    rejectValue?: {error: string[], fieldsErrors?: Array<FieldErrorType>}
}>("auth/login", async (param, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: "loading"}))
    try {
        const res = await authAPI.login(param)
        if (res.data.resultCode === 0) {
            thunkAPI.dispatch(setAppStatusAC({status: "succeeded"}))
            // thunkAPI.dispatch(setIsLoggedInAC({value: true}))
            return {isLoggedIn: true}
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
        builder.addCase(loginTC.fulfilled, (state, action) => {
            // if (action.payload) {
            state.isLoggedIn = action.payload.isLoggedIn
            // }
        });
    }
})

export const authReducer = slice.reducer
export const {setIsLoggedInAC} = slice.actions

// thunks
export const logoutTC = () => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC({status: "loading"}))
    authAPI.logout()
        .then(res => {
            if (res.data.resultCode === 0) {
                dispatch(setIsLoggedInAC({value: false}))
                dispatch(setAppStatusAC({status: "succeeded"}))
            } else {
                handleServerAppError(res.data, dispatch)
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch)
        })
}


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

/*
- DTO – переход объектом из одного слоя в другой чтобы они были стандартизированы
 */
