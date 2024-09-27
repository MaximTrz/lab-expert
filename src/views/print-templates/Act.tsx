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

const ActPrint = (): JSX.Element => {
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

  const [buttonStyle, setButtonStyle] = useState<any>({
    width: '180px',
    marginTop: '20px',
    backgroundColor: '#F1F4F7',
    color: '#414141',
    marginBottom: '20px',
  })

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
      //   navigate(`/orders`, {
      //     replace: true,
      //   })
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

  const user = data?.user
  const userResponsible = data?.responsibleUser
  const actNumber = data?.id

  function DateShow({ date, onDateChange }: any) {
    return (
      <CDatePicker
        placeholder={'Выберите дату'}
        style={{
          width: '60%',
        }}
        locale="ru-RU"
        onDateChange={(e: any) => {
          onDateChange(e)
        }}
        date={date}
        weekdayFormat={1}
      />
    )
  }

  console.log(data, '<<<<<======= INI ADALAH DATA')

  const contentModal = (
    <>
      <div
        style={{
          marginTop: '2%',
        }}
      >
        <CFormInput
          type="text"
          placeholder={'Введите название документа' as any}
          value={formUpload.name}
          onChange={(e: any) => {
            setFormUpload((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }}
        />
      </div>
      <div
        style={{
          marginTop: '1.5rem',
        }}
      >
        <CFormInput
          onChange={(e: any) =>
            setFormUpload((prev) => ({
              ...prev,
              name: e.target?.files[0]?.name?.split('.').slice(0, -1).join('.'),
              file: e.target?.files?.item(0),
            }))
          }
          type="file"
        />
      </div>
    </>
  )

  const handleSaveAsPDF = () => {
    const title = `Акт отбора проб № ${actDetail?.id}}`
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
        <div>
          <CRow>
            <CCard className="mt-4 px-0">
              <CCardHeader>
                <div>Акт отбора проб № {actDetail?.id}</div>
              </CCardHeader>

              <div id="content-to-pdf">
                <CCardBody
                  style={{
                    padding: '4rem 4rem',
                  }}
                >
                  <CCol
                    ref={documentRef}
                    style={{
                      wordBreak: 'break-word',
                    }}
                  >
                    <CForm
                      onSubmit={(e) => {
                        e.preventDefault()
                      }}
                      style={{
                        wordBreak: 'break-word',
                      }}
                    >
                      {/* UPPER INFO BORDER */}
                      {
                        <div>
                          <div
                            style={{
                              margin: '0 auto',
                              width: '200px',
                              fontSize: '16px',
                              color: 'black',
                              textAlign: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            <p>Акт отбора проб № {actDetail?.id}</p>
                          </div>
                        </div>
                      }
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Наименование организации:{' '}
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {data?.user?.company?.name || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Наименование объекта:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {data?.researchObjects
                              ? data?.researchObjects?.name
                              : 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Место отбора проб:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {data?.samplingLocation || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Объект контроля:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {data?.objectControl || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Дата отбора проб:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {getDateV1(actDetail?.samplingDate) || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      {/* START */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Время отбора проб:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {actDetail?.samplingTime || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Наименование материала:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {actDetail?.materialName || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Количество образцов:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '40%',
                            }}
                          >
                            {actDetail?.samplingQuantity || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Документ о качестве:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {actDetail?.qualityDocument || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                          position: 'relative',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Ответственное лицо:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '60%',
                            }}
                          >
                            {actDetail?.respUser ?? 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Примечание:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '40%',
                            }}
                          >
                            {actDetail?.note || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          paddingTop: '2%',
                        }}
                      >
                        <CFormLabel
                          style={{
                            width: '40%',
                          }}
                        >
                          Условия окружающей среды:
                        </CFormLabel>
                        {
                          <CFormLabel
                            style={{
                              width: '40%',
                              whiteSpace: 'normal',
                            }}
                          >
                            {actDetail?.environmental || 'Не выбрано'}
                          </CFormLabel>
                        }
                      </div>
                      <div id="sign-section-act">
                        <div
                          style={{
                            display: 'flex',
                            paddingTop: '6rem',
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                            }}
                          >
                            <span>Фамилия</span>
                            <span>{'_'.repeat(20)}</span>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              justifyContent: 'end',
                              flexDirection: 'row',
                            }}
                          >
                            <span>Подпись</span>
                            <span>{'_'.repeat(20)}</span>
                          </div>
                        </div>
                      </div>
                    </CForm>
                  </CCol>
                </CCardBody>
              </div>
            </CCard>
          </CRow>
        </div>
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

export default ActPrint
