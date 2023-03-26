import {Dispatch} from "redux"
import {authAPI} from "../api/todolists-api"
import {loginTC, logoutTC, setIsLoggedInAC} from "../features/Login/auth-reducer"
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {handleServerAppError, handleServerNetworkError} from "../utils/error-utils";
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

export const initializeAppTC = createAsyncThunk("app/initializeApp", async (param, {dispatch, rejectWithValue}) => {
    const res = await authAPI.me()
    if (res.data.resultCode === 0) {
        // не наш АС поэтому return из него не делаем
        dispatch(setIsLoggedInAC({value: true}))
    } else {   }
    // ЭТО НАШ АС - делаем return !!!
    // dispatch(setAppInitializedAC({isInitialized: true}))
    // return
})

const slice = createSlice({
    name: "app",
    initialState: {
        status: "idle",
        error: null,
        isInitialized: false
    } as InitialStateType,
    reducers: {
        setAppStatusAC: (state, action: PayloadAction<{ status: RequestStatusType }>) => {
            state.status = action.payload.status
        },
        setAppErrorAC: (state, action: PayloadAction<{ error: string | null }>) => {
            state.error = action.payload.error
        },
    },
    extraReducers: (builder) => {
        // action не используемся можно удалить но не будем:
        builder.addCase(initializeAppTC.fulfilled, (state, action) => {
            state.isInitialized = true
        });
    }
})

export const appReducer = slice.reducer

export type RequestStatusType = "idle" | "loading" | "succeeded" | "failed"

// не удаляем тип так как он исользуется в тестах
export type InitialStateType = {
    // происходит ли сейчас взаимодействие с сервером
    status: RequestStatusType
    // если ошибка какая-то глобальная произойдёт - мы запишем текст ошибки сюда
    error: string | null
    // true когда приложение проинициализировалось (проверили юзера, настройки получили и т.д.)
    isInitialized: boolean
}

export const {setAppErrorAC, setAppStatusAC} = slice.actions


