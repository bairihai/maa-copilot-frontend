import {
  Button,
  Callout,
  H4,
  Icon,
  InputGroup,
  MenuItem,
  NonIdealState,
  Overlay,
  TextArea,
} from '@blueprintjs/core'
import { Suggest2 } from '@blueprintjs/select'
import { useLevels } from 'apis/arknights'
import clsx from 'clsx'
import { FormField, FormField2 } from 'components/FormField'
import { HelperText } from 'components/HelperText'
import Fuse from 'fuse.js'
import { Level, MinimumRequired } from 'models/operation'
import { FC, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Control,
  DeepPartial,
  FieldErrors,
  useController,
  useForm,
  UseFormHandleSubmit,
  UseFormSetError,
} from 'react-hook-form'
import { EditorActions } from './action/EditorActions'
import {
  EditorPerformer,
  EditorPerformerProps,
} from './operator/EditorPerformer'

const defaultOperation: DeepPartial<CopilotDocV1.Operation> = {
  minimumRequired: MinimumRequired.V4_0_0,
}

export const StageNameInput: FC<{
  control: Control<CopilotDocV1.Operation, object>
}> = ({ control }) => {
  const {
    field: { onChange, onBlur, ref },
    fieldState: { error },
  } = useController<CopilotDocV1.Operation>({
    name: 'stageName',
    control,
    rules: { required: '请输入关卡' },
  })

  // we are going to manually handle loading state so we could show the skeleton state easily,
  // without swapping the actual element.
  const {
    data,
    error: levelError,
    isValidating,
  } = useLevels({ suspense: false })
  const loading = isValidating && !data

  const levels = data?.data || []

  const fuse = useMemo(
    () =>
      new Fuse(levels, {
        keys: ['name', 'catOne', 'catTwo', 'catThree'],
        threshold: 0.3,
      }),
    [levels],
  )

  return (
    <>
      <FormField2
        label="关卡"
        field="stageName"
        error={levelError || error}
        asterisk
        FormGroupProps={{
          helperText: (
            <>
              <p>键入以搜索</p>
              <p>对于主线、活动关卡：键入关卡代号、关卡中文名或活动名称</p>
              <p>对于悖论模拟关卡：键入关卡名或干员名</p>
            </>
          ),
        }}
      >
        <Suggest2<Level>
          className={clsx(loading && 'bp4-skeleton')}
          disabled={loading}
          items={levels}
          itemRenderer={(item, { handleClick, handleFocus, modifiers }) => (
            <MenuItem
              key={item.levelId}
              text={`${item.catThree} ${item.name}`}
              onClick={handleClick}
              onFocus={handleFocus}
              selected={modifiers.active}
              disabled={modifiers.disabled}
            />
          )}
          itemPredicate={(query, item) => {
            return item.name === query
          }}
          itemListPredicate={(query) => {
            let filteredLevel = levels
            if (query) {
              filteredLevel = fuse.search(query).map((el) => el.item)
            }
            return filteredLevel.sort((a, b) =>
              a.levelId.localeCompare(b.levelId),
            )
          }}
          onItemSelect={(item) => {
            onChange(item.levelId)
          }}
          // selectedItem={createArbitraryOperator(value as string)}
          inputValueRenderer={(item) => `${item.catThree} ${item.name}`}
          ref={ref}
          // createNewItemFromQuery={(query) => createArbitraryOperator(query)}
          // createNewItemRenderer={(query, active, handleClick) => (
          //   <MenuItem
          //     key="create-new-item"
          //     text={`使用自定义干员名 "${query}"`}
          //     icon="text-highlight"
          //     onClick={handleClick}
          //     selected={active}
          //   />
          // )}
          popoverContentProps={{
            className: 'max-h-64 overflow-auto',
          }}
          noResults={<MenuItem disabled text="没有匹配的关卡" />}
          inputProps={{
            placeholder: '关卡',
            large: true,
            onBlur,
          }}
          popoverProps={{
            placement: 'bottom-start',
          }}
        />
      </FormField2>
    </>
  )
}

export const OperationEditor: FC<{
  operation?: CopilotDocV1.Operation
  submitElement: (
    handleSubmit: UseFormHandleSubmit<CopilotDocV1.Operation>,
    setError: UseFormSetError<CopilotDocV1.Operation>,
  ) => ReactNode
}> = ({ operation, submitElement }) => {
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CopilotDocV1.Operation>({
    defaultValues: defaultOperation,
  })

  useEffect(() => {
    if (operation) {
      reset(operation)
    }
  }, [operation])

  const globalError = (errors as FieldErrors<{ global: void }>).global

  return (
    <section className="flex flex-col relative h-full pt-4">
      <div className="px-8 text-lg font-medium flex items-center w-full h-12">
        <Icon icon="document" />
        <span className="ml-2 mr-4">作业编辑器</span>
        {/* <Icon icon="saved" size={14} className="text-gray-600 font-normal" />
          <span className="ml-1 text-sm text-gray-600 font-normal">
            {formatRelativeTime(Date.now())} 已自动保存
          </span> */}

        <div className="flex-1" />

        {submitElement(handleSubmit, setError)}
      </div>

      {globalError?.message && (
        <Callout className="mt-4" intent="danger" icon="error" title="错误">
          {globalError.message}
        </Callout>
      )}

      {import.meta.env.PROD && !location.href.includes('azurestaticapps') && (
        <Overlay
          isOpen
          hasBackdrop={false}
          usePortal={false}
          className="z-20 absolute top-0 left-0 w-full h-full bg-white/60 flex flex-col items-center justify-center select-none"
        >
          <NonIdealState
            title="作业编辑器锐意施工中"
            description="太多了做不完了QAQ"
            icon="cog"
          />
        </Overlay>
      )}

      <div className="py-4 px-8 mr-0.5">
        <H4>作业元信息</H4>
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 md:mr-8">
            <StageNameInput control={control} />
          </div>
          <div className="w-full md:w-3/4">
            <FormField
              label="作业标题"
              field="doc.title"
              control={control}
              ControllerProps={{
                render: ({ field }) => (
                  <InputGroup
                    large
                    id="doc.title"
                    placeholder="起一个引人注目的标题吧"
                    {...field}
                  />
                ),
              }}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 md:mr-8" />
          <div className="w-full md:w-3/4">
            <FormField
              label="作业描述"
              field="doc.details"
              control={control}
              ControllerProps={{
                render: ({ field }) => (
                  <TextArea
                    fill
                    rows={4}
                    growVertically
                    large
                    id="doc.details"
                    placeholder="如：作者名、参考的视频攻略链接（如有）等"
                    {...field}
                  />
                ),
              }}
            />
          </div>
        </div>

        <div className="h-[1px] w-full bg-gray-200 mt-4 mb-6" />

        <div className="flex flex-wrap md:flex-nowrap min-h-[calc(100vh-6rem)]">
          <div className="w-full md:w-1/3 md:mr-8 flex flex-col pb-8">
            <EditorPerformerPanel control={control} />
          </div>
          <div className="w-full md:w-2/3 pb-8">
            <H4>动作序列</H4>
            <HelperText className="mb-4">
              <span>拖拽以重新排序</span>
            </HelperText>
            <EditorActions control={control} />
          </div>
        </div>
      </div>
    </section>
  )
}

const EditorPerformerPanel: FC<EditorPerformerProps> = (props) => {
  const [reload, setReload] = useState(false)

  // temporary workaround for https://github.com/clauderic/dnd-kit/issues/799
  if (reload) {
    setTimeout(() => setReload(false), 100)
    return null
  }

  return (
    <>
      <H4>干员与干员组</H4>
      <HelperText className="mb-4">
        <span>拖拽以重新排序或分配干员</span>
        <span>
          如果拖拽速度过快可能会使动画出现问题，此时请点击
          <Button
            minimal
            className="!inline !p-0 !min-h-0 ![font-size:inherit] !leading-none !align-baseline underline"
            onClick={() => setReload(true)}
          >
            刷新界面
          </Button>
          以修复 （不会丢失数据）
        </span>
      </HelperText>
      <EditorPerformer {...props} />
    </>
  )
}
