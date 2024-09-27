import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const saveAsPDF = (id: string, title: string) => {
  const input = document.getElementById(id) // ID элемента, который вы хотите сохранить как PDF
  if (input) {
    html2canvas(input, { scale: 2 })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png')

        // Размеры A4 в миллиметрах
        const pdfWidth = 210
        const pdfHeight = 297

        // Получаем ширину и высоту изображения в пикселях
        const imgWidth = canvas.width
        const imgHeight = canvas.height

        // Рассчитываем соотношение сторон изображения
        const aspectRatio = imgWidth / imgHeight

        // Новая ширина и высота изображения для A4
        let adjustedImgWidth = pdfWidth
        let adjustedImgHeight = pdfWidth / aspectRatio

        if (adjustedImgHeight > pdfHeight) {
          adjustedImgHeight = pdfHeight
          adjustedImgWidth = pdfHeight * aspectRatio
        }

        // Создаем PDF документ формата A4
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })

        // Убираем отступы (начинаем с 0, 0)
        const xOffset = 0 // Без отступа по горизонтали
        const yOffset = 0 // Без отступа по вертикали

        pdf.addImage(
          imgData,
          'PNG',
          xOffset,
          yOffset,
          adjustedImgWidth,
          adjustedImgHeight,
        )
        pdf.save(title) // Имя файла PDF
      })
      .catch((error) => {
        console.error('Ошибка при создании PDF:', error)
      })
  }
}

export default saveAsPDF
