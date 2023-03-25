import {addTodolistAC, removeTodolistAC, setTodolistsAC} from "./todolists-reducer"
import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from "../../api/todolists-api"
import {Dispatch} from "redux"
import {AppRootStateType} from "../../app/store"
import {setAppStatusAC} from "../../app/app-reducer"
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils"
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"

const initialState: TasksStateType = {}

// первым параметром название редюсера и санки - во 2 параметр придут параметры что прихолили в ТС
// если придет несколько параметров то их передаем  внутри объекта payload
// интерфейс взаимодействия с санкой thunkAPI
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

export const addTaskTC = (title: string, todolistId: string) => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC({status: "loading"}))
    todolistsAPI.createTask(todolistId, title)
        .then(res => {
            if (res.data.resultCode === 0) {
                const task = res.data.data.item
                const action = addTaskAC(task)
                dispatch(action)
                dispatch(setAppStatusAC({status: "succeeded"}))
            } else {
                handleServerAppError(res.data, dispatch)
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch)
        })
}
export const updateTaskTC = (taskId: string, model: UpdateDomainTaskModelType, todolistId: string) =>
    (dispatch: Dispatch, getState: () => AppRootStateType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn("task not found in the state")
            return
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...model
        }

        todolistsAPI.updateTask(todolistId, taskId, apiModel)
            .then(res => {
                if (res.data.resultCode === 0) {
                    const action = updateTaskAC({taskId, model, todolistId})
                    dispatch(action)
                } else {
                    handleServerAppError(res.data, dispatch)
                }
            })
            .catch((error) => {
                handleServerNetworkError(error, dispatch)
            })
    }


const slice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        /*removeTaskAC(state, action: PayloadAction<{ taskId: string, todolistId: string }>) {
            // const tasks = state[action.payload.todolistId]
            // const index = tasks.findIndex(t => t.id === action.payload.taskId)
            // if (index > -1) {
            //     tasks.splice(index, 1)
            // }
        },*/
        addTaskAC(state, action: PayloadAction<TaskType>) {
            state[action.payload.todoListId].unshift(action.payload)
        },
        updateTaskAC(state, action: PayloadAction<{ taskId: string, model: UpdateDomainTaskModelType, todolistId: string }>) {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index > -1) {
                tasks[index] = {...tasks[index], ...action.payload.model}
            }
        },
        /* setTasksAC(state, action: PayloadAction<{ tasks: Array<TaskType>, todolistId: string }>) {
             state[action.payload.todolistId] = action.payload.tasks
         }*/
    },
    extraReducers: (builder) => {
        builder.addCase(addTodolistAC, (state, action) => {
            state[action.payload.todolist.id] = [];
        });
        builder.addCase(removeTodolistAC, (state, action) => {
            delete state[action.payload.id];
        });
        builder.addCase(setTodolistsAC, (state, action) => {
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
    }
})

export const tasksReducer = slice.reducer

// actions
export const {addTaskAC, updateTaskAC} = slice.actions

// thunks

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

