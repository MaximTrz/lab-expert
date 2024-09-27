import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CTimePicker,
  CDatePicker,
  CFormTextarea,
  CFormSelect,
  CCardHeader,
  CSpinner,
  CCardText,
  CCardTitle,
  CAlert,
  CListGroup,
  CListGroupItem,
} from '@coreui/react-pro'
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import OrderApi from '../order/order.api'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTypedSelector } from '../../store'
import Modal from '../../components/Modal'
import DocumentsApi from '../documents/Documents.Api'
import AuthApi from '../auth/auth.api'
import Card from '../../components/Card'

import { getImagePlaceholderFromMime, phoneNumber } from '../../utils'
import setTime, { setTimeV2 } from '../../helper/timeFormat'
import api from '../../api'
import { monthToWord } from '../../helper/timeFormat'
import ProtocolApi, { DocEnum } from '../protocol-reports/ProtocolReports.Api'
import { OrderStatus } from '../../typings'

import saveAsPDF from '../../helper/saveToPdf'

const CommentsPrint = (): JSX.Element => {
  const params = useParams()
  const [data, setData] = useState<any>({})
  const [users, setUsers] = useState<any>()
  const documentOrderIds: any = []
  const [showDate, setShowDate] = useState<any>('')
  const [dataComment, setDataComment] = useState<any>({
    comment: '',
    date: '',
    order: 0,
    users_permissions_user: 0,
  })

  const [loading, setLoading] = useState(true)
  const [dataModal, setDataModal] = useState<any>({
    name: '',
    verificationDate: '',
  })

  const [response, setResponse] =
    useState<{ type: 'success' | 'danger'; message: string }>()
  const [docNumbers, setDocNumbers] = useState<any>([])
  const [docNumbersPreview, setDocNumbersPreview] = useState<any>([])
  const [showPreviewPicture, setShowPreviewPicture] = useState('')
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isDisabled, setIsDisabled] = useState(false)
  const dataUser = useTypedSelector((state) => state.dataUser)
  const isLabUser = useTypedSelector((state) => state.isLabRole)
  const isCompanyAdmin = useTypedSelector(
    (state) => state.dataUser.role == 'companyadmin',
  )
  const [searchParams] = useSearchParams()
  /* const [dataUsers, setDataUsers] = useState<any[]>([]) */
  const companyGlobalState = useTypedSelector((state) => state.company)
  const [modaVisible, setModalVisible] = useState(false)
  const [modal, setModal] = useState<boolean>(false)
  const [formUpload, setFormUpload] = useState<{
    name?: string
    file?: File | null
  }>({})
  const [isNewObject, setIsNewObject] = useState(false)
  const [objectsList, setObjectsList] = useState<any>([])
  const [filteredObjects, setFilteredObjects] = useState<any>({})
  const [employeesList, setEmployeesList] = useState<any>([])
  const [filteredEmployeesList, setFilteredEmployeesList] = useState<any>([])
  const [employeeName, setEmployeeName] = useState('')
  const [labInfo, setLabInfo] = useState<any>({})
  const [closeOrderModal, setCloseOrderModal] = useState(false)
  const [reasonError, setReasonError] = useState(false)
  const [protocolModalVisible, setProtocolModalVisible] = useState(false)
  const [method, setMethod] = useState<null | string>(null)

  const objects = useRef<any>(null)
  const objectsInput = useRef<any>(null)
  const employees = useRef<any>(null)
  const employeesInput = useRef<any>(null)

  const emptyCommentator = {
    name: '',
    surname: '',
    lastName: '',
  }

  const firstSectionRef = useRef<any>()
  const commentRef = useRef<any>()
  const documentRef = useRef<any>()

  const getDateV1 = (date: any, time?: boolean) => {
    const dateObj = new Date(date)
    const month = dateObj.getUTCMonth() + 1 //months from 1-12
    const day = dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear()
    if (time) {
      const hour = date.split(':')[0]
      const minute = date.split(':')[1]

      return `${hour}:${minute}`
    }
    return day + ' ' + monthToWord(month) + ' ' + year
  }

  const getDateV2 = (date: any, time?: boolean) => {
    const dateObj = new Date(date)
    const day = dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear()
    if (time) {
      const hour = date.split(':')[0]
      const minute = date.split(':')[1]

      return `${hour}:${minute}`
    }

    const month = dateObj.toLocaleDateString(undefined, {
      month: 'short',
    })

    return day + ' ' + month + ' ' + year
  }

  const [actDetail, setActDetail] = useState<any>({
    samplingDate: '',
    samplingTime: '',
    respCompUserId: null,
    materialName: '',
    user: '',
    note: '',
    samplingQuantity: '',
    qualityDocument: '',
    id: null,
    environmental: '',
  })
  const [haveAct, setHaveAct] = useState(false)

  const isCompany = dataUser?.role?.includes('company')

  const [alertGoToAddObject, setAlertGoToAddObject] = useState<any>(null)

  const getData = useCallback(
    async (abortController: AbortController, id: string) => {
      setLoading(true)
      OrderApi.getOrderById(+id, abortController).then(
        async (response: any) => {
          // redirect if lab user try to edit order
          if (
            (isLabUser && !response.data.isSelf) ||
            response.data.status == OrderStatus.DONE
          ) {
            //navigate(`/orders/${params.id}?view=true`, { replace: true })
          }

          setData((data: any) => ({ ...data, ...response.data }))

          const samplingAct = response.data.samplingAct

          if (samplingAct) {
            setActDetail({ ...samplingAct })
          }
          setLoading(false)
        },
      )
    },
    [],
  )
  useEffect(() => {
    const abortController = new AbortController()
    if (Number.isNaN(Number.parseInt(params?.id || ''))) {
      // navigate(`/orders`, {
      //   replace: true,
      // })
    }

    if (params.id) {
      dispatch({ type: 'set', order: `${params.id}` })
      getData(abortController, params.id)
    }
    return () => {
      abortController.abort()
    }
  }, [params.id, getData])

  useEffect(() => {
    const abortController = new AbortController()

    return () => {
      abortController.abort()
    }
  }, [companyGlobalState.id])

  const abortControllerGlobal = useMemo(() => new AbortController(), [])

  useEffect(() => {
    return () => {
      abortControllerGlobal.abort()
    }
  }, [])

  console.log(data, '<<<<<======= INI ADALAH DATA')

  const handleSaveAsPDF = () => {
    const title = `Заявка №${data?.id}`
    saveAsPDF('content-to-pdf', title)
  }

  return loading ? (
    <div className="loading_spinner">
      <CSpinner />
    </div>
  ) : (
    <>
      <div
        style={{ maxWidth: visible ? '700px' : '' }}
        onClick={(e: any) => {
          if (e.target !== objectsInput.current) {
            objects.current.style.display = 'none'
          }
          if (
            e.target !== employees.current &&
            e.target !== employeesInput.current &&
            employees.current
          ) {
            employees.current.style.display = 'none'
          }
        }}
      >
        <CRow>
          <CCard className="mt-4 px-0">
            <CCardHeader>
              <div>Комментарии к заявке</div>
            </CCardHeader>
            <div id="content-to-pdf">
              <CCardBody
                style={{
                  padding: '4rem 4rem',
                }}
              >
                <CCol
                  ref={commentRef}
                  style={{
                    wordBreak: 'break-word',
                  }}
                >
                  <CForm>
                    {/* UPPER INFO BORDER */}
                    {
                      <div>
                        <div
                          className="avoid-break-inside"
                          style={{
                            margin: '0 auto',
                            width: '250px',
                            fontSize: '16px',
                            color: 'black',
                            textAlign: 'center',
                            fontWeight: 'bold',
                          }}
                        >
                          <p style={{}}>Комментарии к заявке № {data?.id}</p>
                        </div>
                      </div>
                    }
                    <div>
                      {data?.comments?.length ? (
                        <div>
                          {data?.comments?.map((e: any, i: number) => {
                            const { user, createdAt } = e
                            const { surname, name, lastName } =
                              user ?? emptyCommentator

                            return (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  marginBottom: '0.7rem',
                                }}
                                className="auto-page-break-stop-recursive avoid-break-inside"
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '25%',
                                  }}
                                >
                                  {/* <CFormLabel> */}
                                  <div
                                    style={{
                                      marginBottom: '0.5rem',
                                      width: '590px',
                                    }}
                                  >
                                    {surname} {name[0]}. {lastName[0]}. :
                                  </div>
                                  {/* </CFormLabel> */}
                                  <div
                                    style={{
                                      width: '300px',
                                      color: 'GrayText',
                                      fontSize: '12px',
                                      marginBottom: '0.5rem',
                                    }}
                                  >
                                    {setTimeV2(e.createdAt)}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    wordWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    width: '75%',
                                  }}
                                >
                                  {e?.text}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>

                    <div data-html2canvas-ignore>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'end',
                          marginTop: '2rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '590px',
                          }}
                        ></div>
                        {/* //FIELD BAR */}
                        <div style={{ width: '100%', padding: '0 1rem' }}>
                          <CFormTextarea
                            id="info"
                            rows={data?.comment?.split('\n').length}
                            placeholder={
                              'Введите: Класс прочности бетона; Материал; Тип грунта; и т.д.' as any
                            }
                            style={{
                              width: '100%',
                            }}
                            value={data?.comment}
                            onChange={(e: any) => {
                              setDataComment({
                                text: e?.target?.value,
                                orderId: params.id,
                                userId: dataUser.id,
                              })
                              ///sendButtonStyle(e?.target?.value)
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'right',
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* BUTTOM BORDER */}
                    </div>
                  </CForm>
                </CCol>
              </CCardBody>
            </div>
          </CCard>
        </CRow>

        <div
          className="auto-page-break-stop-recursive"
          style={{
            marginTop: '10px',
            flex: 1,
            display: 'flex',
            justifyContent: 'end',
            flexDirection: 'row',
          }}
        >
          <CButton onClick={handleSaveAsPDF}>Скачать</CButton>
        </div>
      </div>
    </>
  )
}

export default CommentsPrint
