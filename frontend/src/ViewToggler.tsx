import React, { useState } from 'react';


const ViewToggler = (props) => {
  const {isToggled, appView} = props;
  const [selectedId, setSelectedId] = useState('')
  const toggleHandler = (e) => {
    appView(e.target.id)
    setSelectedId(e.target.id)
  }
  return (
    <div style={{width: '347px'}} className='bg-slate-400 m-auto rounded-md flex justify-between overflow-hidden'>
      <button
        className={
          selectedId === 'Accesibility' ? 'bg-blue-700 w-xxs p-[8px] font-bold' : 'w-xxs p-[8px] text-black'
        }
        style={{outline: 'none'}}
        onClick={toggleHandler}
        id='Accesibility'
      >
        Image Accesibility
      </button>
      <button
        className={
          selectedId === 'Generation' ? 'bg-blue-700 w-xxs p-[8px] font-bold' : 'w-xxs p-[8px] text-black'
        }
        style={{outline: 'none'}}
        onClick={toggleHandler}
        id='Generation'
      >
        Image Generation
      </button>
    </div>
  )
}

export default ViewToggler;