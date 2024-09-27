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

const AccDocument = (): JSX.Element => {
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
    const title = `Сопроводительные документы к заявке №${data?.id}`
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
        <CCard className="mt-4 px-0">
          <div id="content-to-pdf">
            <CCardHeader>
              <div>Сопроводительные документы к заявке №{data?.id}</div>
            </CCardHeader>
            <CCardBody
              style={{
                padding: '4rem 4rem',
              }}
            >
              <CCol>
                <CForm>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginBottom: '20px',
                    }}
                  >
                    {data.documents?.map((el: any, i: number) => {
                      return (
                        <div
                          style={{
                            flex: '0 0 33.33%',
                            display: 'flex',
                            padding: '1rem',
                            cursor: el.file ? 'pointer' : 'not-allowed',
                          }}
                          key={i}
                          className="mt-2"
                          onClick={() => {
                            const file = el.file?.url
                            if (
                              file &&
                              (file?.includes('.pdf') ||
                                file?.includes('.jpg') ||
                                file?.includes('.jpeg') ||
                                file?.includes('.bmp') ||
                                file?.includes('.png'))
                            ) {
                              navigate(
                                `/orders/document/${el.id}/${data.id}?name=${el.name}`,
                              )
                            }
                          }}
                        >
                          <div
                            style={{
                              flex: '0 0 100%',
                            }}
                          >
                            <CCard
                              style={{
                                width: '288px',
                                height: '100%',
                              }}
                            >
                              <img
                                style={{ height: '150px' }}
                                alt={el.name}
                                src={
                                  getImagePlaceholderFromMime(el.file?.url) ??
                                  null
                                }
                              />
                              <CCardBody>
                                <CCardTitle>{el.name}</CCardTitle>
                                {el.createdAt ? (
                                  <CCardText>{setTime(el.createdAt)}</CCardText>
                                ) : (
                                  <></>
                                )}
                              </CCardBody>
                            </CCard>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CForm>
              </CCol>
            </CCardBody>
          </div>
        </CCard>

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
          {data.documents && data.documents.length > 0 && (
            <CButton onClick={handleSaveAsPDF}>Скачать</CButton>
          )}
        </div>
      </div>
    </>
  )
}

export default AccDocument
