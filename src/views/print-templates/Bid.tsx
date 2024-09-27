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

const BidPrint = (): JSX.Element => {
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
          <CCard className="px-0">
            <CCardHeader>
              <div>
                Заявка №{data?.id} от {getDateV1(data?.createdAt)}г.
              </div>
            </CCardHeader>
            <div id="content-to-pdf">
              <CCardBody
                style={{
                  padding: '6rem 4rem',
                }}
              >
                <CCol
                  ref={firstSectionRef}
                  style={{
                    wordBreak: 'break-word',
                  }}
                >
                  <CForm>
                    {/* UPPER INFO BORDER */}
                    <div
                      className="avoid-break-inside"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          flex: 2,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            paddingTop: '2px',
                          }}
                        >
                          <CFormLabel
                            style={{
                              flex: 1,
                            }}
                          >
                            Контрагент:{' '}
                          </CFormLabel>
                          <CFormLabel
                            style={{
                              flex: 2,
                              color: 'black',
                              fontWeight: 'bold',
                            }}
                          >
                            {data?.user
                              ? `${data?.user?.company?.legalForm} «${data?.user?.company?.name}»`
                              : '-'}
                          </CFormLabel>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            paddingTop: '2px',
                          }}
                        >
                          <CFormLabel
                            style={{
                              flex: 1,
                            }}
                          >
                            Заявку составил:{' '}
                          </CFormLabel>
                          <CFormLabel
                            style={{
                              flex: 2,
                              color: 'black',
                              fontWeight: 'bold',
                            }}
                          >
                            {user
                              ? `${user?.surname} ${user?.name[0]}.${
                                  user.lastName ? `${user?.lastName[0]}.` : ''
                                }`
                              : ''}
                          </CFormLabel>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                          }}
                        >
                          <CFormLabel
                            style={{
                              flex: 1,
                            }}
                          >
                            Телефон составителя:{' '}
                          </CFormLabel>
                          <CFormLabel
                            style={{
                              flex: 2,
                              color: 'black',
                              fontWeight: 'bold',
                            }}
                          >
                            {user.phone[0] == '8' ||
                            user.phone[0] == '+' ||
                            user.phone[0] == '2' ||
                            user.phone == ''
                              ? user.phone
                              : `+${user.phone}`}
                          </CFormLabel>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <div
                            style={{
                              flex: 1,
                            }}
                          >
                            <p>Ответственный :</p>
                          </div>
                          <div
                            style={{
                              flex: 2,
                              color: 'black',
                              fontWeight: 'bold',
                            }}
                          >
                            <p>
                              {userResponsible?.name
                                ? `${userResponsible?.surname} ${userResponsible?.name[0]}.${userResponsible?.lastName[0]}.`
                                : 'Не заполнено'}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <div
                            style={{
                              // width: '200px',
                              flex: 1,
                            }}
                          >
                            <p>Телефон исполнителя:</p>
                          </div>
                          <div
                            style={{
                              flex: 2,
                              color: 'black',
                              fontWeight: 'bold',
                            }}
                          >
                            <p>
                              {userResponsible?.phone
                                ? phoneNumber(userResponsible.phone)
                                : 'Не заполнено'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '16px',
                          color: 'black',
                          textAlign: 'end',
                          flex: 1,
                        }}
                      >
                        <p>
                          Генеральному директору
                          <br />
                          {labInfo?.legalForm + ' ' + labInfo?.name}
                          <br />
                          {`${labInfo.owner?.surname} ${labInfo.owner?.name?.[0]}. ${labInfo.owner?.lastName?.[0]}.`}
                        </p>
                      </div>
                    </div>
                    {/* HERE IT SHOWS IF VIEW IS TRUE */}
                    {
                      <>
                        <div className="avoid-break-inside">
                          <div
                            style={{
                              margin: '0 auto',
                              width: '360px',
                              fontSize: '16px',
                              color: 'black',
                              textAlign: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            <p style={{}}>
                              Заявка № {data?.id} от{' '}
                              {getDateV1(data?.createdAt)}
                              г.
                            </p>
                          </div>
                        </div>
                      </>
                    }
                    {/* UPPER INFO BORDER */}
                    <div
                      style={{
                        paddingTop: '40px',
                        paddingBottom: '40px',
                      }}
                    >
                      <p>
                        Прошу провести испытания по ниже указанным параметрам:
                      </p>
                    </div>

                    <div
                      className="avoid-break-inside"
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
                        Контрагент:{' '}
                      </CFormLabel>
                      {
                        <CFormLabel
                          style={{
                            width: '60%',
                          }}
                        >
                          {data.testDate
                            ? getDateV1(data?.testDate)
                            : 'Не выбрано'}
                        </CFormLabel>
                      }
                    </div>

                    <div
                      className="avoid-break-inside"
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
                        Дата проведения испытаний:{' '}
                      </CFormLabel>
                      {
                        <CFormLabel
                          style={{
                            width: '60%',
                          }}
                        >
                          {data.testDate
                            ? getDateV1(data?.testDate)
                            : 'Не выбрано'}
                        </CFormLabel>
                      }
                    </div>

                    <div
                      className="avoid-break-inside"
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
                        Время проведения испытаний:{' '}
                      </CFormLabel>
                      {
                        <CFormLabel
                          style={{
                            width: '60%',
                          }}
                        >
                          {data?.testTime ?? 'Не выбрано'}
                        </CFormLabel>
                      }
                    </div>

                    <div
                      className="avoid-break-inside"
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
                        Виды работ:
                      </CFormLabel>
                      {
                        <CFormLabel
                          style={{
                            width: '60%',
                          }}
                        >
                          {data?.typeJob || 'Не выбрано'}
                        </CFormLabel>
                      }
                    </div>
                    <div
                      className="avoid-break-inside"
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
                        Объект строительства:
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
                      className="avoid-break-inside"
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
                      className="avoid-break-inside"
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
                      className="avoid-break-inside"
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
                        Проект:
                      </CFormLabel>
                      {
                        <CFormLabel
                          style={{
                            width: '60%',
                          }}
                        >
                          {data?.name || 'Не выбрано'}
                        </CFormLabel>
                      }
                    </div>
                    <div
                      className="avoid-break-inside"
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
                        Краткая информация:
                      </CFormLabel>
                      {
                        <CFormLabel
                          style={{
                            width: '60%',
                          }}
                        >
                          {data?.description || 'Не выбрано'}
                        </CFormLabel>
                      }
                    </div>
                    <div
                      {...(!actNumber
                        ? { 'data-html2canvas-ignore': true }
                        : {})}
                      style={{
                        /* display: 'flex', */
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          marginTop: '10px',
                          width: '500px',
                        }}
                      >
                        {actDetail.id ? (
                          <>
                            <CFormLabel
                              style={{
                                width: '200px',
                                color: 'black',
                                fontWeight: 'bold',
                              }}
                            >
                              Приложение:
                            </CFormLabel>
                            <CFormLabel
                              style={{
                                width: '300px',
                                color: 'black',
                                fontWeight: 'bold',
                              }}
                            >
                              Акт отбора проб № {actDetail?.id ?? '-'}
                            </CFormLabel>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    </div>
                    <div className="sign-section">
                      <div
                        style={{
                          display: 'flex',
                          paddingTop: '6rem',
                        }}
                      >
                        <div
                          className="auto-page-break-stop-recursive"
                          style={{
                            flex: 1,
                          }}
                        >
                          <span>Фамилия</span>
                          <span>{'_'.repeat(20)}</span>
                        </div>
                        <div
                          className="auto-page-break-stop-recursive"
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
                <div
                  className="auto-page-break-stop-recursive"
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'end',
                    flexDirection: 'row',
                  }}
                ></div>
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

export default BidPrint
