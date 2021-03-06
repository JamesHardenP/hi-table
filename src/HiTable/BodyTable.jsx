import React, { useState, useContext, useRef, useEffect } from 'react'
import Row from './Row'
import TableContext from './context'
import _ from 'lodash'
import { flatTreeData, setDepth } from './util'

const BodyTable = props => {
  const [expandedTreeRows, setExpandedTreeRows] = useState([])
  const {
    bordered,
    data,
    columns,
    activeSorterColumn,
    activeSorterType,
    maxHeight,
    headerTableRef,
    stickyHeaderRef,
    bodyTableRef,
    fixedBodyTableRef,
    syncScrollLeft,
    syncScrollTop,
    firstRowRef,
    realColumnsWidth,
    resizable,
    scrollWidth,
    setEachRowHeight
  } = useContext(TableContext)
  // **************** 获取colgroup
  let _columns = _.cloneDeep(columns)
  let depthArray = []
  setDepth(_columns, 0, depthArray)
  const columnsgroup = flatTreeData(_columns).filter(col => col.isLast)
  // ****************

  // **************** 同步滚动位置
  const tableRef = useRef(null)

  // **************** 根据排序列处理数据
  let _data = data

  if (activeSorterColumn) {
    let sorter =
      columns.filter(d => d.dataKey === activeSorterColumn)[0] &&
      columns.filter(d => d.dataKey === activeSorterColumn)[0].sorter

    if (sorter) {
      _data =
        activeSorterType === 'ascend'
          ? [...data].sort(sorter)
          : [...data].sort(sorter).reverse()
    }
  }
  // ************* 处理求和、平均数
  const hasSumColumn =
    columns.filter(item => {
      return item.total
    }).length > 0
  let sumRow = { key: 'sum' }
  columns.forEach((c, index) => {
    if (index === 0) {
      sumRow[c.dataKey] = '合计'
    }
    if (c.total) {
      sumRow[c.dataKey] = _.sumBy(_data, d => d[c.dataKey])
    }
  })
  const hasAvgColumn =
    columns.filter(item => {
      return item.avg
    }).length > 0
  let avgRow = { key: 'avg' }
  columns.forEach((c, index) => {
    if (index === 0) {
      avgRow[c.dataKey] = '平均值'
    }
    if (c.sum) {
      avgRow[c.dataKey] = _.sumBy(_data, d => d[c.dataKey]) / _data.length
    }
  })
  useEffect(() => {
    if (tableRef.current && tableRef.current.children[1].children) {
      let rowHeightArray = Array.from(
        tableRef.current.children[1].children
      ).map(tr => tr.clientHeight)
      setEachRowHeight(rowHeightArray)
    }
  }, [data])

  let hasTree = false
  if (_data && _data.length) {
    hasTree = _data.some(row => {
      return row.children && row.children.length
    })
  }

  const renderRow = (row, level, index, rowConfig = {}, isTree) => {
    let childrenHasTree = false
    if (row.children && row.children.length) {
      childrenHasTree = row.children.some(
        child => child.children && child.children.length
      )
    }
    return (
      <React.Fragment key={row.key}>
        <Row
          innerRef={index === 0 ? firstRowRef : null}
          key={row.key}
          rowData={row}
          level={level}
          index={index}
          expandedTree={expandedTreeRows.includes(row.key)}
          expandedTreeRows={expandedTreeRows}
          setExpandedTreeRows={setExpandedTreeRows}
          isAvgRow={rowConfig.isAvgRow}
          isSumRow={rowConfig.isSumRow}
          isTree={isTree}
        />
        {row.children &&
          expandedTreeRows.includes(row.key) &&
          row.children.map(child => {
            return renderRow(
              child,
              level + 1,
              index,
              _,
              childrenHasTree || isTree
            )
          })}
      </React.Fragment>
    )
  }
  return (
    <div
      style={{
        maxHeight: maxHeight || 'auto',
        overflowY:
          tableRef.current && tableRef.current.clientHeight > maxHeight
            ? 'scroll'
            : null, // maxHeight 小于 table 实际高度才处滚动条
        overflowX:
          (bodyTableRef.current && bodyTableRef.current.clientWidth) <
          (tableRef.current && tableRef.current.clientWidth)
            ? 'scroll'
            : null // 表格宽度大于div宽度才展示横向滚动条
      }}
      ref={bodyTableRef}
      onScroll={e => {
        syncScrollLeft(bodyTableRef.current.scrollLeft, headerTableRef.current)
        syncScrollLeft(bodyTableRef.current.scrollLeft, stickyHeaderRef.current)
        syncScrollTop(bodyTableRef.current.scrollTop, fixedBodyTableRef.current)
      }}
    >
      <table
        ref={tableRef}
        style={{
          borderLeft: bordered ? '1px solid #e7e7e7' : 'none',
          width: scrollWidth || '100%'
        }}
      >
        <colgroup>
          {columnsgroup.map((c, index) => (
            <col
              key={index}
              style={{
                width: resizable ? realColumnsWidth[index] : c.width,
                minWidth: resizable ? realColumnsWidth[index] : c.width
                // width: c.width,
                // minWidth: c.width
              }}
            />
          ))}
        </colgroup>
        <tbody>
          {_data &&
            _data.map((row, index) => renderRow(row, 1, index, _, hasTree))}
          {hasSumColumn &&
            renderRow(sumRow, 1, data.length, { isSumRow: true })}
          {hasAvgColumn &&
            renderRow(avgRow, 1, data.length + 1, { isAvgRow: true })}
        </tbody>
      </table>
    </div>
  )
}

export default BodyTable
