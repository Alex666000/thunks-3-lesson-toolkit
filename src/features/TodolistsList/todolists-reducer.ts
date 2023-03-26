import {todolistsAPI, TodolistType} from "../../api/todolists-api"
import {RequestStatusType, setAppStatusAC} from "../../app/app-reducer"
import {handleServerNetworkError} from "../../utils/error-utils"
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"

// const initialState: Array<TodolistDomainType> = []

export const fetchTodolistsTC = createAsyncThunk("todolists/fetchTodolists", async (param, {
    dispatch,
    rejectWithValue
}) => {
    dispatch(setAppStatusAC({status: "loading"}))
    try {
        const res = await todolistsAPI.getTodolists()
        dispatch(setAppStatusAC({status: "succeeded"}))
        // так как наш АС:
        // dispatch(setTodolistsAC({todolists: res.data}))
        return {todolists: res.data}

    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})


export const removeTodolistTC = createAsyncThunk("todolists/removeTodolist", async (todolistId: string, {
    dispatch,
    rejectWithValue
}) => {
    dispatch(setAppStatusAC({status: "loading"}))
    //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
    dispatch(changeTodolistEntityStatusAC({id: todolistId, status: "loading"}))

    try {
        const res = await todolistsAPI.deleteTodolist(todolistId)
        dispatch(setAppStatusAC({status: "succeeded"}))
        return {id: todolistId}
    } catch (e) {
        rejectWithValue({error: "some error"})
    }
})

export const addTodolistTC = createAsyncThunk("todolists/addTodolist", async (title: string, {
    dispatch,
    rejectWithValue
}) => {
    dispatch(setAppStatusAC({status: "loading"}))

    try {
        const res = await todolistsAPI.createTodolist(title)
        dispatch(setAppStatusAC({status: "succeeded"}))
        // dispatch(addTodolistAC({todolist: res.data.data.item}))
        return {todolist: res.data.data.item}
    } catch (e) {
        return rejectWithValue(null)
    }
})

export const changeTodolistTitleTC = createAsyncThunk("todolists/changeTodolistTitle", async (param: { id: string, title: string }, {
    dispatch,
    rejectWithValue
}) => {
    try {
        const res = await todolistsAPI.updateTodolist(param.id, param.title)
        // dispatch(changeTodolistTitleAC({id: id, title}))
        // что такое id, title?
        return {id: param.id, title: param.title}
    } catch (e) {
        return rejectWithValue({error: "ERROR!!!"})
    }
})

const slice = createSlice({
    name: "todolists",
    initialState: [] as Array<TodolistDomainType>,
    reducers: {
        changeTodolistFilterAC(state, action: PayloadAction<{ id: string, filter: FilterValuesType }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            state[index].filter = action.payload.filter;
        },
        changeTodolistEntityStatusAC(state, action: PayloadAction<{ id: string, status: RequestStatusType }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            state[index].entityStatus = action.payload.status;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchTodolistsTC.fulfilled, (state, action) => {
            return action.payload.todolists.map(tl => ({...tl, filter: "all", entityStatus: "idle"}))
        });
        builder.addCase(removeTodolistTC.fulfilled, (state, action) => {
            const index = state.findIndex(tl => tl.id === action?.payload?.id);
            if (index > -1) {
                state.splice(index, 1);
            }
        });
        builder.addCase(addTodolistTC.fulfilled, (state, action) => {
            state.unshift({...action?.payload?.todolist, filter: "all", entityStatus: "idle"})
        });
        builder.addCase(changeTodolistTitleTC.fulfilled, (state, action) => {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            state[index].title = action.payload.title;
        });
    }
})
// export slice
export const todolistsReducer = slice.reducer
export const {
    changeTodolistFilterAC, changeTodolistEntityStatusAC
} = slice.actions

// types
export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
