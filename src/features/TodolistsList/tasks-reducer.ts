import {addTodolistTC, fetchTodolistsTC, removeTodolistTC} from "./todolists-reducer"
import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from "../../api/todolists-api"
import {AppRootStateType} from "../../app/store"
import {setAppStatusAC} from "../../app/app-reducer"
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils"
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

const initialState: TasksStateType = {}
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

export const fetchTasksTC = createAsyncThunk("tasks/fetchTasks", async (todolistId: string, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: "loading"}))
    const res = await todolistsAPI.getTasks(todolistId);
    const tasks = res.data.items
    thunkAPI.dispatch(setAppStatusAC({status: "succeeded"}))
    // return thunkAPI.dispatch(setTasksAC({tasks, todolistId}))
    // возвращаем данные:
    return {tasks, todolistId}
})
// определяем 1 параметр который принимаем
export const removeTaskTC = createAsyncThunk("tasks/removeTask", (param: { taskId: string, todolistId: string }, thunkAPI) => {
    // пользуемся этим параметром
    return todolistsAPI.deleteTask(param.todolistId, param.taskId)
        // возвращаем в 1 строку этот объект {taskId: param.taskId, todolistId: param.todolistId}
        .then(res => ({taskId: param.taskId, todolistId: param.todolistId}))
})

export const addTaskTC = createAsyncThunk("tasks/addTask", async (param: { title: string, todolistId: string }, {
    dispatch,
    rejectWithValue
}) => {
    dispatch(setAppStatusAC({status: "loading"}))
    try {
        const res = await todolistsAPI.createTask(param.todolistId, param.title)
        if (res.data.resultCode === 0) {
            // не наш АС не трогаем:
            dispatch(setAppStatusAC({status: "succeeded"}))
            // наш меняем AC:
            // dispatch(addTaskAC(res.data.data.item))
            return res.data.data.item
        } else {
            handleServerAppError(res.data, dispatch)
            // т к при добавлении таски возможна ошибка - делаем заглушку c return
            return rejectWithValue(null)
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        // т к при добавлении таски возможна ошибка - делаем заглушку c return
        return rejectWithValue(null)
    }
})

export const updateTaskTC = createAsyncThunk("tasks/updateTask", async (param: { taskId: string, model: UpdateDomainTaskModelType, todolistId: string }, {
    dispatch,
    rejectWithValue,
    getState,
}) => {
    const state = getState() as AppRootStateType
    const task = state.tasks[param.todolistId].find(t => t.id === param.taskId)
    if (!task) {
        //throw new Error("task not found in the state");
        // console.warn("task not found in the state")
        return rejectWithValue("task not found in the state")
    }

    const apiModel: UpdateTaskModelType = {
        deadline: task.deadline,
        description: task.description,
        priority: task.priority,
        startDate: task.startDate,
        title: task.title,
        status: task.status,
        ...param.model
    }

    try {
        const res = await todolistsAPI.updateTask(param.todolistId, param.taskId, apiModel)
        if (res.data.resultCode === 0) {
            // return {taskId: param.taskId, model: param.model, todolistId: param.todolistId}
            // или сокращенно:
            return param
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})

const slice = createSlice({
    name: "tasks",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(addTodolistTC.fulfilled, (state, action) => {
            state[action.payload.todolist.id] = [];
        });
        builder.addCase(removeTodolistTC.fulfilled, (state, action) => {
            if (action.payload) delete state[action?.payload?.id];
        });
        builder.addCase(fetchTodolistsTC.fulfilled, (state, action) => {
            action.payload.todolists.forEach((tl: any) => {
                state[tl.id] = []
            })
        });
        builder.addCase(fetchTasksTC.fulfilled, (state, action) => {
            state[action.payload.todolistId] = action.payload.tasks
        });
        builder.addCase(removeTaskTC.fulfilled, (state, action) => {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index > -1) {
                tasks.splice(index, 1)
            }
        });
        builder.addCase(addTaskTC.fulfilled, (state, action) => {
            state[action.payload.todoListId].unshift(action.payload)
        });
        builder.addCase(updateTaskTC.fulfilled, (state, action) => {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index > -1) {
                tasks[index] = {...tasks[index], ...action.payload.model}
            }
        });
    }
})
// export reducer и actions
export const tasksReducer = slice.reducer
export const {} = slice.actions

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}

